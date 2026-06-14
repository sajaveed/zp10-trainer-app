import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { LangProvider } from './hooks/useLang'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import Landing from './pages/Landing'

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <LangProvider>
      <AuthProvider>
        <Navbar onAuthClick={() => setModalOpen(true)} />
        <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        <Routes>
          <Route path="/" element={<Landing onAuthClick={() => setModalOpen(true)} />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </LangProvider>
  )
}
