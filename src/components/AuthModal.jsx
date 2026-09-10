import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../hooks/useLang'
import { useAuth } from '../hooks/useAuth'
import { recordLogin } from '../lib/loginAttempts'
import logo from '../assets/logo.png'
import styles from './AuthModal.module.css'

export default function AuthModal({ isOpen, onClose }) {
  const { t } = useLang()
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [schoolType, setSchoolType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const reset = useCallback(() => {
    setError('')
    setLoading(false)
    setEmail('')
    setPassword('')
    setFirstName('')
    setSchoolType('')
    setSignUpSuccess(false)
  }, [])

  const handleClose = useCallback(() => { reset(); onClose() }, [onClose, reset])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleClose, isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleSuccessToLogin = useCallback(() => {
    setSignUpSuccess(false)
    setFirstName('')
    setSchoolType('')
    setError('')
    setTab('login')
  }, [])

  if (!isOpen) return null

  const handleTab = (next) => { setTab(next); reset() }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (tab === 'login') {
        const { data, error } = await signInWithEmail(email, password)
        if (error) setError(error.message)
        else {
          const u = data?.user
          recordLogin(u?.id || u?.email || email)
          handleClose()
          navigate('/dashboard')
        }
      } else {
        const { data, error } = await signUpWithEmail(email, password, { first_name: firstName, school_type: schoolType })
        if (error) setError(error.message)
        else if (data?.session) {
          const u = data?.user
          recordLogin(u?.id || u?.email || email)
          setSignUpSuccess(true)
        } else {
          setSignUpSuccess(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && (signUpSuccess ? handleSuccessToLogin() : handleClose())}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.close} onClick={signUpSuccess ? handleSuccessToLogin : handleClose} aria-label="Schließen">×</button>

        <div className={styles.header}>
          <img src={logo} alt="ZP10 Trainer" className={styles.logo} />
          <span className={styles.logoText}>ZP10<span>Trainer</span></span>
        </div>

        {signUpSuccess ? (
          <div className={styles.successScreen}>
            <div className={styles.successIcon}>✅</div>
            <p className={styles.successMessage}>{t.auth.confirmEmailMessage}</p>
            <button type="button" className={styles.successBtn} onClick={handleSuccessToLogin}>
              {t.auth.goToLogin}
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tabs}>
              <button className={tab === 'login' ? styles.active : ''} onClick={() => handleTab('login')}>{t.auth.signIn}</button>
              <button className={tab === 'signup' ? styles.active : ''} onClick={() => handleTab('signup')}>{t.auth.signUp}</button>
            </div>

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
          </>
        )}
      </div>
    </div>
  )
}
