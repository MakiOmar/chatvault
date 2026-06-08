import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Upload as UploadIcon, FileArchive, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Upload() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      toast.error('Please select a ZIP file')
      return
    }

    setFile(selectedFile)
    setUploadResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('chatZip', file)

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000
      })

      setUploadResult(response.data)
      toast.success('Chat uploaded successfully!')
    } catch (error) {
      const message = error.response?.data?.error || 'Upload failed'
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-whatsapp-bg-light dark:bg-whatsapp-bg-dark">
      <header className="bg-whatsapp-primary text-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center space-x-3">
          <Link to="/dashboard" className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Upload WhatsApp Chat</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">How to export from WhatsApp</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm">
            <li>Open the chat in WhatsApp on your phone</li>
            <li>Tap the menu (⋮) → Export chat</li>
            <li>Choose <strong>Include media</strong></li>
            <li>Save the ZIP file and upload it here</li>
          </ol>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-whatsapp-primary bg-whatsapp-primary/5'
              : 'border-gray-300 dark:border-gray-600 hover:border-whatsapp-primary'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          <FileArchive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {file ? (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                Drop your ZIP file here
              </p>
              <p className="text-sm text-gray-500 mt-1">or click to browse (max 500 MB)</p>
            </div>
          )}
        </div>

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full mt-6 bg-whatsapp-primary text-white py-3 rounded-xl font-semibold hover:bg-whatsapp-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <UploadIcon className="w-5 h-5" />
              <span>Upload & Process</span>
            </>
          )}
        </button>

        {/* Success result */}
        {uploadResult && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h3 className="font-semibold text-green-800 dark:text-green-300">Upload complete!</h3>
            </div>
            <div className="text-sm text-green-700 dark:text-green-400 space-y-1 mb-4">
              <p>{uploadResult.stats.messages} messages imported</p>
              <p>{uploadResult.stats.participants} participants</p>
              <p>{uploadResult.stats.mediaFiles} media files</p>
            </div>
            <button
              onClick={() => navigate(`/chat/${uploadResult.chatId}`)}
              className="bg-whatsapp-primary text-white px-6 py-2 rounded-lg hover:bg-whatsapp-secondary transition-colors text-sm"
            >
              View Chat
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
