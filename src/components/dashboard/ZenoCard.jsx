import { useLang } from '../../hooks/useLang'
import styles from './ZenoCard.module.css'

export default function ZenoCard() {
  const { t } = useLang()

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.avatar}>🤖</span>
        <div>
          <h3 className={styles.name}>{t.dashboard.zenoTitle}</h3>
          <span className={styles.badge}>{t.dashboard.zenoBadge}</span>
        </div>
      </div>
      <p className={styles.teaser}>{t.dashboard.zenoTeaser}</p>
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          type="text"
          placeholder={t.dashboard.zenoPlaceholder}
          disabled
          aria-label={t.dashboard.zenoPlaceholder}
        />
        <button className={styles.btn} type="button" disabled>
          {t.dashboard.zenoBtn}
        </button>
      </div>
      <p className={styles.hint}>{t.dashboard.zenoHint}</p>
    </div>
  )
}
