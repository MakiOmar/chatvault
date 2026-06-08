import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import {
  MessageCircle,
  Upload,
  Settings,
  LogOut,
  Search,
  Trash2,
  Users,
  MessagesSquare
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/chats')
      setChats(response.data.chats || [])
    } catch (error) {
      toast.error('Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (chatId, chatName) => {
    if (!window.confirm(`Delete "${chatName}"? This cannot be undone.`)) return

    setDeletingId(chatId)
    try {
      await axios.delete(`/api/chats/${chatId}`)
      setChats((prev) => prev.filter((chat) => chat.id !== chatId))
      toast.success('Chat deleted')
    } catch (error) {
      toast.error('Failed to delete chat')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-whatsapp-primary text-white px-4 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-7 h-7" />
            <div>
              <h1 className="text-lg font-semibold">ChatVault Web</h1>
              <p className="text-white/80 text-sm">Welcome, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/upload"
              className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Link>
            <Link
              to="/settings"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {chats.length === 0 ? 'No chats yet' : 'No matching chats'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {chats.length === 0
                ? 'Upload a WhatsApp export ZIP to get started.'
                : 'Try a different search term.'}
            </p>
            {chats.length === 0 && (
              <Link
                to="/upload"
                className="inline-flex items-center space-x-2 bg-whatsapp-primary text-white px-6 py-3 rounded-xl hover:bg-whatsapp-secondary transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Chat</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center"
              >
                <Link
                  to={`/chat/${chat.id}`}
                  className="flex-1 flex items-center space-x-4 p-4"
                >
                  <div className="w-12 h-12 bg-whatsapp-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-whatsapp-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {chat.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{chat.participant_count} participants</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessagesSquare className="w-3.5 h-3.5" />
                        <span>{chat.message_count} messages</span>
                      </span>
                    </div>
                  </div>
                  {chat.end_date && (
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {format(new Date(chat.end_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => handleDelete(chat.id, chat.name)}
                  disabled={deletingId === chat.id}
                  className="p-4 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Delete chat"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
