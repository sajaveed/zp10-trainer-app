import styles from './ProgressBar.module.css'

export default function ProgressBar({ value, label }) {
  const available = Number.isFinite(value)
  const percent = available ? Math.min(100, Math.max(0, value)) : 0

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={available ? percent : undefined}
      aria-valuetext={available ? `${percent}%` : 'Fortschritt nicht verfügbar'}
    >
      <span className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  )
}
