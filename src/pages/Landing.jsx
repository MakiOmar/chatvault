import React from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Upload, Eye, Shield, Smartphone, Monitor } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Landing() {
  const features = [
    {
      icon: Upload,
      title: 'Easy Upload',
      description: 'Simply upload your WhatsApp exported ZIP files and we\'ll handle the rest'
    },
    {
      icon: Eye,
      title: 'Perfect Recreation',
      description: 'View your chats exactly as they appeared in WhatsApp with all media intact'
    },
    {
      icon: Shield,
      title: 'Self-Hosted Security',
      description: 'Your data stays on your server. No cloud storage, complete privacy control'
    },
    {
      icon: Smartphone,
      title: 'Responsive Design',
      description: 'Access your chats from any device with our mobile-optimized interface'
    }
  ]

  const steps = [
    {
      step: '01',
      title: 'Export from WhatsApp',
      description: 'Go to WhatsApp > Chat > Export Chat > Include Media'
    },
    {
      step: '02',
      title: 'Upload ZIP File',
      description: 'Upload your exported ZIP file to ChatVault Web'
    },
    {
      step: '03',
      title: 'View Your Chats',
      description: 'Browse and view your chats with the familiar WhatsApp interface'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-whatsapp-primary/5 via-white to-whatsapp-secondary/5 dark:from-whatsapp-dark/50 dark:via-whatsapp-bg-dark dark:to-whatsapp-primary/10">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-whatsapp-primary rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">ChatVault Web</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link 
              to="/login" 
              className="text-gray-600 dark:text-gray-300 hover:text-whatsapp-primary transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="bg-whatsapp-primary text-white px-6 py-2 rounded-lg hover:bg-whatsapp-secondary transition-colors"
            >
              Get Started
            </Link>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  View Your
                  <span className="text-whatsapp-primary block">WhatsApp Chats</span>
                  Like Never Before
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Self-hosted WhatsApp chat viewer that recreates the exact WhatsApp Web experience. 
                  Upload your exported chats and relive your conversations with complete privacy.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register"
                  className="bg-whatsapp-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-whatsapp-secondary transition-all transform hover:scale-105 text-center"
                >
                  Start Viewing Chats
                </Link>
                <Link 
                  to="/login"
                  className="border-2 border-whatsapp-primary text-whatsapp-primary px-8 py-4 rounded-xl font-semibold hover:bg-whatsapp-primary hover:text-white transition-all text-center"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-whatsapp-primary p-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Family Group</div>
                    <div className="text-white/80 text-sm">4 participants</div>
                  </div>
                </div>
                <div className="p-4 space-y-3 h-64 overflow-hidden">
                  <div className="flex justify-end">
                    <div className="bg-whatsapp-bubble-sent max-w-xs p-3 rounded-lg">
                      <p className="text-sm">Hey everyone! 👋</p>
                      <p className="text-xs text-gray-500 mt-1">2:30 PM</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-whatsapp-bubble-received max-w-xs p-3 rounded-lg">
                      <p className="text-sm font-semibold text-whatsapp-primary">Mom</p>
                      <p className="text-sm">Hello dear! How was your day?</p>
                      <p className="text-xs text-gray-500 mt-1">2:32 PM</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-whatsapp-bubble-received max-w-xs p-3 rounded-lg">
                      <p className="text-sm font-semibold text-whatsapp-primary">Dad</p>
                      <p className="text-sm">Don't forget about dinner tonight! 🍽️</p>
                      <p className="text-xs text-gray-500 mt-1">2:35 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose ChatVault Web?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience the perfect blend of familiarity and innovation with our WhatsApp-inspired interface
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-whatsapp-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-whatsapp-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Get started in just three simple steps
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-whatsapp-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-whatsapp-primary to-whatsapp-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold text-white">
              Ready to Explore Your Chat History?
            </h2>
            <p className="text-xl text-white/90">
              Join thousands of users who trust ChatVault Web for secure, private chat viewing
            </p>
            <Link 
              to="/register"
              className="inline-block bg-white text-whatsapp-primary px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Get Started for Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-whatsapp-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ChatVault Web</span>
            </div>
            <p className="text-gray-400 text-center md:text-right">
              © 2025 ChatVault Web. Self-hosted WhatsApp chat viewer.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
