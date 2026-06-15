import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './hooks/useLang'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <LangProvider>
      <AuthProvider>
        <Navbar onAuthClick={() => setModalOpen(true)} />
        <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        <Routes>
          <Route path="/" element={<Landing onAuthClick={() => setModalOpen(true)} />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        </Routes>
        <Footer />
      </AuthProvider>
    </LangProvider>
  )
}
