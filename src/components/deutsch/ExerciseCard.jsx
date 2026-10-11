import styles from '../../pages/Deutsch.module.css'

function PdfAction({ path, label, icon }) {
  if (!path) {
    return (
      <button type="button" className={`${styles.pdfButton} ${styles.pdfButtonDisabled}`} disabled>
        <span aria-hidden="true">{icon}</span>{label}
        <span className={styles.pdfFollow}>PDF folgt</span>
      </button>
    )
  }

  return (
    <a className={styles.pdfButton} href={path} target="_blank" rel="noopener noreferrer">
      <span aria-hidden="true">{icon}</span>{label}
    </a>
  )
}

export default function ExerciseCard({ exercise, category }) {
  return (
    <article className={styles.exerciseCard}>
      <div className={styles.exerciseHeading}>
        <div>
          <p className={styles.exerciseType}>{category.taskType}</p>
          <h4 className={styles.exerciseTitle}>{exercise.title}</h4>
        </div>
        <span className={styles.points}>{exercise.points} P.</span>
      </div>
      <div className={styles.exerciseActions}>
        <PdfAction path={exercise.pdfPath} label="Aufgabe öffnen" icon="📄" />
        <PdfAction path={exercise.evaluationPath} label="Auswertungsbogen" icon="📋" />
      </div>
    </article>
  )
}
