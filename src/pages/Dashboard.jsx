import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { subjectProgress } from '../data/dashboardData'
import CountdownCard from '../components/dashboard/CountdownCard'
import OverallProgressCard from '../components/dashboard/OverallProgressCard'
import SubjectCard from '../components/dashboard/SubjectCard'
import ExamOverviewCard from '../components/dashboard/ExamOverviewCard'
import LastActivityCard from '../components/dashboard/LastActivityCard'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useLang()

  const name =
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    null

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            {t.dashboard.greeting}{name ? ` ${name}` : ''} 👋
          </h1>
          <p className={styles.subtitle}>{t.dashboard.subtitle}</p>
        </div>
      </header>

      {/* ── Top row: countdown + overall progress ── */}
      <div className={styles.topRow}>
        <CountdownCard />
        <OverallProgressCard />
      </div>

      {/* ── Subject cards ── */}
      <section>
        <h2 className={styles.sectionTitle}>{t.dashboard.subjects}</h2>
        <div className={styles.subjectsGrid}>
          {subjectProgress.map(s => (
            <SubjectCard
              key={s.subject}
              subject={s.subject}
              progress={s.progress}
              path={s.path}
              icon={s.icon}
            />
          ))}
        </div>
      </section>

      {/* ── Bottom row: exam overview + last activity ── */}
      <div className={styles.bottomRow}>
        <ExamOverviewCard />
        <LastActivityCard />
      </div>
    </div>
  )
}
