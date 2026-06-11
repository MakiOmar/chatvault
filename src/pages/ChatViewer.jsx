import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { ArrowLeft, Search, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

function getMediaUrl(mediaPath) {
  if (!mediaPath) return null
  const normalized = mediaPath.replace(/\\/g, '/')
  const uploadsIndex = normalized.indexOf('/uploads/')
  if (uploadsIndex >= 0) return normalized.slice(uploadsIndex)
  const parts = normalized.split('/uploads/')
  if (parts.length > 1) return `/uploads/${parts[parts.length - 1]}`
  return null
}

function MessageContent({ message }) {
  const mediaUrl = getMediaUrl(message.media_path)

  if (message.message_type === 'image' && mediaUrl) {
    return (
      <img
        src={mediaUrl}
        alt={message.media_filename || 'Image'}
        className="max-w-full rounded-lg mt-1"
        loading="lazy"
      />
    )
  }

  if (message.message_type === 'video' && mediaUrl) {
    return (
      <video src={mediaUrl} controls className="max-w-full rounded-lg mt-1" />
    )
  }

  if (message.message_type === 'audio' && mediaUrl) {
    return <audio src={mediaUrl} controls className="mt-1 w-full" />
  }

  if (message.message_type === 'document' && mediaUrl) {
    return (
      <a
        href={mediaUrl}
        download={message.media_filename}
        className="text-whatsapp-primary underline text-sm mt-1 inline-block"
      >
        📎 {message.media_filename || 'Download file'}
      </a>
    )
  }

  if (message.content) {
    return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
  }

  if (message.message_type !== 'text') {
    return (
      <p className="text-sm text-gray-500 italic">
        {message.media_filename || 'Media not included in export'}
      </p>
    )
  }

  return null
}

export default function ChatViewer() {
  const { chatId } = useParams()
  const { user } = useAuth()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)

  const fetchChat = useCallback(async () => {
    try {
      const response = await axios.get(`/api/chats/${chatId}`)
      setChat(response.data.chat)
    } catch (error) {
      toast.error('Failed to load chat')
    }
  }, [chatId])

  const fetchMessages = useCallback(async (pageNum, search = '', append = false) => {
    try {
      const params = { page: pageNum, limit: 50 }
      if (search) params.search = search

      const response = await axios.get(`/api/chats/${chatId}/messages`, { params })
      const newMessages = response.data.messages || []

      setMessages((prev) => (append ? [...newMessages, ...prev] : newMessages))
      setHasMore(pageNum < response.data.pagination.pages)
      setPage(pageNum)
    } catch (error) {
      toast.error('Failed to load messages')
    }
  }, [chatId])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchChat(), fetchMessages(1)])
      setLoading(false)
    }
    init()
  }, [fetchChat, fetchMessages])

  useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loading, messages.length])

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    await fetchMessages(1, searchQuery)
    setLoading(false)
  }

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await fetchMessages(page + 1, searchQuery, true)
    setLoadingMore(false)
  }

  const isGroupChat = chat?.participants?.length > 2

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Chat header */}
      <header className="bg-whatsapp-primary text-white px-4 py-3 flex items-center space-x-3 shadow-md flex-shrink-0">
        <Link to="/dashboard" className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{chat?.name || 'Chat'}</h1>
          {chat?.participants && (
            <p className="text-white/80 text-xs flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{chat.participants.length} participants</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>
      </header>

      {/* Search bar */}
      {searchOpen && (
        <form onSubmit={handleSearch} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in this chat..."
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </form>
      )}

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto chat-background px-4 py-4 scrollbar-thin"
      >
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-sm text-whatsapp-primary hover:underline disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-2">
          {messages.map((message) => {
            const isSent = message.sender === user?.name
            return (
              <div
                key={message.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
                  {!isSent && isGroupChat && (
                    <p className="text-xs font-semibold text-whatsapp-primary mb-0.5">
                      {message.sender}
                    </p>
                  )}
                  <MessageContent message={message} />
                  <p className="text-[10px] text-gray-500 mt-1 text-right">
                    {format(new Date(message.timestamp), 'h:mm a')}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && (
          <p className="text-center text-gray-500 mt-10">No messages found</p>
        )}
      </div>
    </div>
  )
}
