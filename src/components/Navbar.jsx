import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useLang } from '../hooks/useLang'
import { useAuth } from '../hooks/useAuth'
import { useThemeSettings } from '../hooks/useThemeSettings'
import Brand from './Brand'
import styles from './Navbar.module.css'

export default function Navbar({ onAuthClick }) {
  const { lang, setLang, t } = useLang()
  const { user, signOut } = useAuth()
  const { resolvedTheme, setThemePreference } = useThemeSettings()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        document.getElementById('public-menu-toggle')?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <nav aria-label={lang === 'de' ? 'Öffentliche Navigation' : 'Public navigation'} className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <Link to={pathname === '/' ? '/#home' : '/'} className={styles.logo} aria-label="ZP10 Trainer">
        <Brand />
      </Link>

      <ul id="public-navigation-links" className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
        <li><a href="/#how" onClick={() => setMenuOpen(false)}>{t.nav.how}</a></li>
        <li><a href="/#subjects" onClick={() => setMenuOpen(false)}>{t.nav.subjects}</a></li>
        <li><a href="/#ki" onClick={() => setMenuOpen(false)}>{t.nav.aiFeedback}</a></li>
        <li><a href="/#faq" onClick={() => setMenuOpen(false)}>FAQ</a></li>
      </ul>

      <div className={styles.right}>
        <div className={styles.langToggle}>
          <button aria-pressed={lang === 'de'} lang="de" className={lang === 'de' ? styles.active : ''} onClick={() => setLang('de')}>DE</button>
          <button aria-pressed={lang === 'en'} lang="en" className={lang === 'en' ? styles.active : ''} onClick={() => setLang('en')}>EN</button>
        </div>
        {!user && (
          <button
            type="button"
            className={styles.themeToggle}
            onClick={() => setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label={t.nav.themeToggle}
            title={t.nav.themeToggle}
          >
            {resolvedTheme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
        )}
        {user ? (
          <button className={styles.btnNav} onClick={signOut}>{t.dashboard.signOut}</button>
        ) : (
          <button className={styles.btnNav} onClick={onAuthClick}>{t.nav.signIn}</button>
        )}
        <button id="public-menu-toggle" className={styles.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label={lang === 'de' ? 'Menü' : 'Menu'} aria-expanded={menuOpen} aria-controls="public-navigation-links">
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
    </nav>
  )
}
