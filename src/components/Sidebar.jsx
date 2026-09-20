import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
  { label: 'Deutsch', path: '/deutsch', icon: '📝' },
  { label: 'Englisch', path: '/englisch', icon: '🌍' },
  { label: 'Mathematik', path: '/mathematik', icon: '📐' },
  { label: 'Zeno', path: '/zeno', icon: '🤖' },
  { label: 'Fortschritt', path: '/fortschritt', icon: '📈' },
  { label: 'Einstellungen', path: '/settings', icon: '⚙️' },
]

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const { user, signOut } = useAuth()
  const { t } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)

  const name =
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'Nutzer'
  const schoolType = user?.user_metadata?.school_type || 'Klasse 10'
  const initials = name.slice(0, 2).toUpperCase()

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={() => setMobileOpen(true)}
        aria-label="Menü öffnen"
      >
        <span /><span /><span />
      </button>

      {mobileOpen && (
        <div className={styles.overlay} onClick={closeMobile} aria-hidden="true" />
      )}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.topRow}>
          <Link to="/dashboard" className={styles.logoArea} onClick={closeMobile}>
            <span className={styles.logoIcon}>🎓</span>
            <span className={styles.logoText}>ZP10 Trainer</span>
          </Link>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? t.dashboard.sidebarExpand : t.dashboard.sidebarCollapse}
            title={isCollapsed ? t.dashboard.sidebarExpand : t.dashboard.sidebarCollapse}
          >
            {isCollapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className={styles.nav} aria-label="Hauptnavigation">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={closeMobile}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.userArea}>
          <div className={styles.avatar} aria-hidden="true">{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{name}</span>
            <span className={styles.userClass}>{schoolType}</span>
          </div>
          <button
            className={styles.signOutBtn}
            onClick={signOut}
            title={t.dashboard.signOut}
            aria-label={t.dashboard.signOut}
          >
            🚪
          </button>
        </div>
      </aside>
    </>
  )
}
