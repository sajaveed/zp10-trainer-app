import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Languages, Calculator, Bot, ChartNoAxesColumn, Settings, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import styles from './Sidebar.module.css'
import { getUserName } from '../utils/userName'
import Brand from './Brand'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Deutsch', path: '/deutsch', icon: BookOpen },
  { label: 'Englisch', path: '/englisch', icon: Languages },
  { label: 'Mathematik', path: '/mathematik', icon: Calculator },
  { label: 'Zeno', path: '/zeno', icon: Bot },
  { label: 'Fortschritt', path: '/fortschritt', icon: ChartNoAxesColumn },
  { label: 'Einstellungen', path: '/settings', icon: Settings },
]

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const { user, signOut } = useAuth()
  const { t } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)

  const name = getUserName(user)
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
        <Menu aria-hidden="true" />
      </button>

      {mobileOpen && (
        <div className={styles.overlay} onClick={closeMobile} aria-hidden="true" />
      )}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.collapseRow}>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? t.dashboard.sidebarExpand : t.dashboard.sidebarCollapse}
            title={isCollapsed ? t.dashboard.sidebarExpand : t.dashboard.sidebarCollapse}
          >
            {isCollapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
          </button>
        </div>

        <div className={styles.topRow}>
          <Link to="/dashboard" aria-label="ZP10 Trainer" className={styles.logoArea} onClick={closeMobile}>
            <span className={styles.fullBrand}><Brand /></span>
            <span className={styles.compactBrand}><Brand compact /></span>
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Hauptnavigation">
          {NAV_ITEMS.map(({ icon: Icon, ...item }) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={closeMobile}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}><Icon aria-hidden="true" /></span>
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
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  )
}
