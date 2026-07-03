import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import styles from './Placeholder.module.css'

export default function Mathematik() {
  const { emailConfirmed } = useAuth()
  const { t } = useLang()

  if (!emailConfirmed) {
    return (
      <div className={`${styles.page} ${styles.lockState}`}>
        <div className={styles.lockIcon}>🔒</div>
        <p className={styles.sub}>{t.dashboard.contentLocked}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>📐 Mathematik</h1>
      <p className={styles.sub}>Hier erscheinen bald deine Mathematik-Aufgaben und Übungen.</p>
    </div>
  )
}
