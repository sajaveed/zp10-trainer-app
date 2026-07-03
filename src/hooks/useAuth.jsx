import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const locationRef = useRef(location)
  locationRef.current = location

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && locationRef.current.pathname === '/') {
        navigate('/dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })

  const signInWithApple = () =>
    supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } })

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email, password, metadata) =>
    supabase.auth.signUp({ email, password, options: { data: metadata } })

  const resendConfirmationEmail = async () => {
    if (!user?.email) return false

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    })

    return !error
  }

  const signOut = () => supabase.auth.signOut()
  const emailConfirmed = !!user?.email_confirmed_at

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        emailConfirmed,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        resendConfirmationEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
