'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import {
  generateDeviceToken,
  createDeviceSession,
  validateDeviceToken,
  getStoredDeviceToken,
  getDeviceTokenFromURL,
  storeDeviceToken,
  removeDeviceToken,
  revokeCurrentDeviceSession,
} from '@/lib/deviceToken'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  setProfile: (profile: Profile) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Step 1: Check if there's an active Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // User already has an active session
          setUser(session.user)
          await fetchProfile(session.user.id)
          setLoading(false)
          return
        }

        // Step 2: Check for device token in URL (cross-domain login)
        const urlToken = getDeviceTokenFromURL()
        if (urlToken) {
          const result = await tryDeviceTokenLogin(urlToken)
          if (result) {
            // Remove token from URL after successful login
            window.history.replaceState({}, document.title, window.location.pathname)
            return
          }
        }

        // Step 3: Check for stored device token (auto-login)
        const storedToken = getStoredDeviceToken()
        if (storedToken) {
          await tryDeviceTokenLogin(storedToken)
          return
        }

        // No session or device token - user needs to log in
        setLoading(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
        
        // Create device session when user logs in
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const token = generateDeviceToken()
          await createDeviceSession(supabase, session.user.id, token)
        }
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Try to log in using a device token
   */
  const tryDeviceTokenLogin = async (token: string): Promise<boolean> => {
    try {
      // Validate token with fingerprint check
      const validation = await validateDeviceToken(token)
      
      if (!validation.valid || !validation.userId) {
        console.error('Device token validation failed:', validation.error)
        removeDeviceToken()
        setLoading(false)
        return false
      }

      // Token is valid - create new Supabase session
      const response = await fetch('/api/auth/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: validation.userId }),
      })

      if (!response.ok) {
        console.error('Failed to create session')
        removeDeviceToken()
        setLoading(false)
        return false
      }

      const sessionData = await response.json()
      
      // Set the session in Supabase
      const { error } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
      })

      if (error) {
        console.error('Error setting session:', error)
        removeDeviceToken()
        setLoading(false)
        return false
      }

      // Store the token for future use
      storeDeviceToken(token)
      
      // Session will be handled by onAuthStateChange
      return true
    } catch (error) {
      console.error('Error during device token login:', error)
      removeDeviceToken()
      setLoading(false)
      return false
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data as Profile)
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      setProfile(null)
    }
  }

  const signOut = async () => {
    // Revoke device session
    if (user) {
      await revokeCurrentDeviceSession(supabase, user.id)
    }
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear local state
    setUser(null)
    setProfile(null)
    removeDeviceToken()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
