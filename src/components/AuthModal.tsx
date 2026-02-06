'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, User, Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (profile: Profile) => void
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps): JSX.Element {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          setError('Failed to fetch profile')
          setLoading(false)
          return
        }

        onAuthSuccess(profile as Profile)
        onClose()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Fetch profile (created by trigger)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          setError('Failed to fetch profile')
          setLoading(false)
          return
        }

        onAuthSuccess(profile as Profile)
        onClose()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'login') {
      handleLogin()
    } else {
      handleSignup()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="bg-[#0F0F0F] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#fff0f5] to-[#ffd1db] mb-4">
                  <User className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-400 text-sm" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                  {mode === 'login' 
                    ? 'Sign in to access your projects and themes' 
                    : 'Join dalley to save your creations'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <Label htmlFor="username" className="text-gray-300 text-sm mb-2 block" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                        Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="johndoe"
                          className="bg-[#1A1A1A] border-gray-700 text-white pl-10 h-11 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="fullName" className="text-gray-300 text-sm mb-2 block" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                        Full Name (Optional)
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-[#1A1A1A] border-gray-700 text-white h-11 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="email" className="text-gray-300 text-sm mb-2 block" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-[#1A1A1A] border-gray-700 text-white pl-10 h-11 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-300 text-sm mb-2 block" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[#1A1A1A] border-gray-700 text-white pl-10 h-11 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg"
                    style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:opacity-90 h-11 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </span>
                  )}
                </Button>
              </form>

              {/* Toggle Mode */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login')
                    setError('')
                  }}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                  style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                >
                  {mode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] font-semibold">
                        Sign Up
                      </span>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] font-semibold">
                        Sign In
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
