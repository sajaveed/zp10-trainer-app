import { useState, useEffect } from 'react'
import { useLang } from '../hooks/useLang'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo.png'
import styles from './AuthModal.module.css'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)

export default function AuthModal({ isOpen, onClose }) {
  const { t } = useLang()
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } = useAuth()
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [schoolType, setSchoolType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const reset = () => { setError(''); setEmail(''); setPassword(''); setFirstName(''); setSchoolType('') }

  const handleTab = (next) => { setTab(next); reset() }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (tab === 'login') {
        const { error } = await signInWithEmail(email, password)
        if (error) setError(error.message)
        else onClose()
      } else {
        const { error } = await signUpWithEmail(email, password, { first_name: firstName, school_type: schoolType })
        if (error) setError(error.message)
        else onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.close} onClick={onClose} aria-label="Schließen">×</button>

        <div className={styles.header}>
          <img src={logo} alt="ZP10 Trainer" className={styles.logo} />
          <span className={styles.logoText}>ZP10<span>Trainer</span></span>
        </div>

        <div className={styles.tabs}>
          <button className={tab === 'login' ? styles.active : ''} onClick={() => handleTab('login')}>{t.auth.signIn}</button>
          <button className={tab === 'signup' ? styles.active : ''} onClick={() => handleTab('signup')}>{t.auth.signUp}</button>
        </div>

        <button className={styles.socialBtn} onClick={signInWithGoogle}>
          <GoogleIcon /> {t.auth.withGoogle}
        </button>
        <button className={styles.socialBtn} onClick={signInWithApple}>
          <AppleIcon /> {t.auth.withApple}
        </button>

        <div className={styles.divider}>{t.auth.orEmail}</div>

        <form onSubmit={handleEmailSubmit}>
          {tab === 'signup' && (
            <>
              <div className={styles.field}>
                <label>{t.auth.firstName}</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Max" required />
              </div>
              <div className={styles.field}>
                <label>{t.auth.schoolType}</label>
                <select value={schoolType} onChange={e => setSchoolType(e.target.value)} required>
                  <option value="" disabled>{t.auth.schoolPlaceholder}</option>
                  <option value="gym">{t.auth.gym}</option>
                  <option value="msa">{t.auth.msa}</option>
                  <option value="eesa">{t.auth.eesa}</option>
                </select>
              </div>
            </>
          )}
          <div className={styles.field}>
            <label>{t.auth.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@schule.de" required />
          </div>
          <div className={styles.field}>
            <label>{t.auth.password}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? '...' : tab === 'login' ? t.auth.submitSignIn : t.auth.submitSignUp}
          </button>
        </form>

        <p className={styles.switchNote}>
          {tab === 'login' ? (
            <>{t.auth.noAccount} <button onClick={() => handleTab('signup')}>{t.auth.signUpLink}</button></>
          ) : (
            <>{t.auth.hasAccount} <button onClick={() => handleTab('login')}>{t.auth.signInLink}</button></>
          )}
        </p>
      </div>
    </div>
  )
}
