import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && location.pathname === '/') {
        navigate('/dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [location.pathname, navigate])

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email, password, metadata) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/confirm`,
      },
    })

  const resendConfirmationEmail = async () => {
    if (!user?.email) return false

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    })

    return !error
  }

  const requestPasswordReset = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

  const updatePassword = (password) =>
    supabase.auth.updateUser({ password })

  const signOut = () => supabase.auth.signOut()
  const emailConfirmed = !!user?.email_confirmed_at

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        emailConfirmed,
        signInWithEmail,
        signUpWithEmail,
        requestPasswordReset,
        updatePassword,
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
