import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

// Supabase client initialization with error handling
let supabase = null

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ts_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)
  const [useSupabaseAuth, setUseSupabaseAuth] = useState(false)

  // Initialize Supabase if available (required for production auth)
  const initSupabase = async () => {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY
      if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('xxxxx')) {
        const { createClient } = await import('@supabase/supabase-js')
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        setUseSupabaseAuth(true)
        return true
      }
    } catch (err) {}
    return false
  }

  // Initialize authentication - restore session from localStorage
  useEffect(() => {
    const init = async () => {
      try {
        // Check if user session exists in localStorage
        const storedUser = localStorage.getItem('ts_user')
        const storedToken = localStorage.getItem('ts_token')
        
        if (storedUser && storedToken) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (e) {
            localStorage.removeItem('ts_user')
            localStorage.removeItem('ts_token')
          }
        }

        // Attempt Supabase initialization for production (optional)
        try {
          await initSupabase()
        } catch (err) {}
      } catch (err) {
        // Auth initialization error - silent fail
      }
    }

    init()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
      try {
        if (!useSupabaseAuth || !supabase) {
          return { success: false, error: 'Authentication service unavailable' }
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          return { success: false, error: error.message }
        }
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
          role: data.user.user_metadata?.role || 'analyst',
        }
        localStorage.setItem('ts_user', JSON.stringify(userData))
        localStorage.setItem('ts_token', data.session.access_token)
        setUser(userData)
        return { success: true }
      } catch (err) {
        return { success: false, error: 'Authentication failed' }
      } finally {
        setLoading(false)
      }
  }

  const register = async (email, username, password) => {
    setLoading(true)
    try {
      if (useSupabaseAuth && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, role: 'analyst' },
          },
        })
        if (error) return { success: false, error: 'Registration failed' }
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: username || data.user.email?.split('@')[0],
          role: 'analyst',
        }
        localStorage.setItem('ts_user', JSON.stringify(userData))
        if (data.session) {
          localStorage.setItem('ts_token', data.session.access_token)
        }
        setUser(userData)
        return { success: true }
      }
      return { success: false, error: 'Registration failed: Supabase not configured' }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Registration failed'
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setLoading(true)
    try {
      if (useSupabaseAuth && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        })
        if (error) return { success: false, error: error.message }
        return { success: true }
      }
      return { success: false, error: 'Supabase Google OAuth is not configured yet' }
    } catch (err) {
      return { success: false, error: err.message || 'Google login failed' }
    } finally {
      setLoading(false)
    }
  }

  const loginWithLinkedIn = async () => {
    setLoading(true)
    try {
      if (useSupabaseAuth && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'linkedin',
          options: {
            redirectTo: `${window.location.origin}`,
          },
        })
        if (error) return { success: false, error: error.message }
        return { success: true }
      }
      return { success: false, error: 'Supabase LinkedIn OAuth is not configured yet' }
    } catch (err) {
      return { success: false, error: err.message || 'LinkedIn login failed' }
    } finally {
      setLoading(false)
    }
  }

  const loginWithX = async () => {
    setLoading(true)
    try {
      if (useSupabaseAuth && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'twitter',
          options: {
            redirectTo: `${window.location.origin}`,
          },
        })
        if (error) return { success: false, error: error.message }
        return { success: true }
      }
      return { success: false, error: 'Supabase X OAuth is not configured yet' }
    } catch (err) {
      return { success: false, error: err.message || 'X login failed' }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCallback = async (code) => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/google/callback?code=${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.detail || 'Google callback failed' }
      }
      
      const data = await response.json()
      const userData = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role,
        subscription_tier: data.user.subscription_tier,
      }
      
      localStorage.setItem('ts_user', JSON.stringify(userData))
      localStorage.setItem('ts_token', data.access_token)
      setUser(userData)
      
      // Redirect to dashboard if came from login page
      const redirectPath = sessionStorage.getItem('auth_redirect') || '/dashboard'
      sessionStorage.removeItem('auth_redirect')
      return { success: true, redirect: redirectPath }
    } catch (err) {
      return { success: false, error: err.message || 'Google callback failed' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    if (useSupabaseAuth && supabase) {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        // Logout error - silent fail
      }
    }
    localStorage.removeItem('ts_token')
    localStorage.removeItem('ts_user')
    setUser(null)
  }

  // Check for Google OAuth callback code on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code) {
      handleGoogleCallback(code).then(result => {
        if (result.success) {
          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = result.redirect
          }, 500)
        }
      })
    }
  }, [])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithLinkedIn,
    loginWithX,
    handleGoogleCallback,
    useSupabaseAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
