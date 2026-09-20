import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import styles from './DashboardLayout.module.css'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'zp10-sidebar-collapsed'

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1'
  })

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, isSidebarCollapsed ? '1' : '0')
  }, [isSidebarCollapsed])

  return (
    <div className={`${styles.layout} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
