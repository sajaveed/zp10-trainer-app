import { useState, useEffect } from 'react'
import { useLang } from '../hooks/useLang'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo.png'
import styles from './Navbar.module.css'

export default function Navbar({ onAuthClick }) {
  const { lang, setLang, t } = useLang()
  const { user, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <a href="#home" className={styles.logo}>
        <img src={logo} alt="ZP10 Trainer" className={styles.logoImg} />
        <span className={styles.logoText}>ZP10<span>Trainer</span></span>
      </a>

      <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
        <li><a href="#how" onClick={() => setMenuOpen(false)}>{t.nav.how}</a></li>
        <li><a href="#subjects" onClick={() => setMenuOpen(false)}>{t.nav.subjects}</a></li>
        <li><a href="#ki" onClick={() => setMenuOpen(false)}>{t.nav.aiFeedback}</a></li>
        <li><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a></li>
      </ul>

      <div className={styles.right}>
        <div className={styles.langToggle}>
          <button className={lang === 'de' ? styles.active : ''} onClick={() => setLang('de')}>DE</button>
          <button className={lang === 'en' ? styles.active : ''} onClick={() => setLang('en')}>EN</button>
        </div>
        {user ? (
          <button className={styles.btnNav} onClick={signOut}>{t.dashboard.signOut}</button>
        ) : (
          <button className={styles.btnNav} onClick={onAuthClick}>{t.nav.signIn}</button>
        )}
        <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
