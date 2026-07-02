import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { LangProvider } from './hooks/useLang'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import DashboardLayout from './components/DashboardLayout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Deutsch from './pages/Deutsch'
import Englisch from './pages/Englisch'
import Mathematik from './pages/Mathematik'
import Fortschritt from './pages/Fortschritt'
import Settings from './pages/Settings'

const DASHBOARD_PATHS = ['/dashboard', '/deutsch', '/englisch', '/mathematik', '/fortschritt', '/settings']

function AppContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const { pathname } = useLocation()
  // Use exact match or sub-path match (trailing '/') to avoid false positives like /settings-old
  const isDashboard = DASHBOARD_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <>
      {!isDashboard && <Navbar onAuthClick={() => setModalOpen(true)} />}
      {!isDashboard && <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
      <Routes>
        <Route path="/" element={<Landing onAuthClick={() => setModalOpen(true)} />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/deutsch" element={<Deutsch />} />
          <Route path="/englisch" element={<Englisch />} />
          <Route path="/mathematik" element={<Mathematik />} />
          <Route path="/fortschritt" element={<Fortschritt />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      {!isDashboard && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LangProvider>
  )
}
