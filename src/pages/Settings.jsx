import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Moon, Sun, Lock, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Settings() {
  const { user, logout, changePassword } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return
    }

    if (passwordForm.newPassword.length < 6) {
      return
    }

    setChangingPassword(true)
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
    if (result.success) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
    setChangingPassword(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-whatsapp-bg-light dark:bg-whatsapp-bg-dark">
      <header className="bg-whatsapp-primary text-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center space-x-3">
          <Link to="/dashboard" className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-whatsapp-primary" />
            <span>Profile</span>
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Name</span>
              <span className="text-gray-900 dark:text-white font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-gray-900 dark:text-white font-medium">{user?.email}</span>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            {isDark ? <Moon className="w-5 h-5 text-whatsapp-primary" /> : <Sun className="w-5 h-5 text-whatsapp-primary" />}
            <span>Appearance</span>
          </h2>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-300">Theme</span>
            <span className="text-sm text-whatsapp-primary font-medium capitalize">{theme}</span>
          </button>
        </section>

        {/* Change password */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-whatsapp-primary" />
            <span>Change Password</span>
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-whatsapp-primary text-white py-3 rounded-lg font-semibold hover:bg-whatsapp-secondary transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {changingPassword ? <LoadingSpinner size="sm" /> : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Sign Out</span>
        </button>
      </main>
    </div>
  )
}
