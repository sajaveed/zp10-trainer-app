import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { openMaterialPdf } from '../../lib/materialsApi'
import { useCompletedExercises } from '../../hooks/useCompletedExercises'
import styles from '../../pages/Deutsch.module.css'

function PdfAction({ path, label, primary = false, onOpen, disabled }) {
  if (!path) {
    return (
      <button type="button" className={`ui-button ui-button-secondary ${styles.pdfButton} ${styles.pdfButtonDisabled}`} disabled>
        {label}
        <span className={styles.pdfFollow}>Nicht verfügbar</span>
      </button>
    )
  }

  return (
    <button type="button" className={`ui-button ${primary ? '' : 'ui-button-secondary'} ${styles.pdfButton}`} onClick={onOpen} disabled={disabled}>
      {label}<ExternalLink size={16} aria-hidden="true" /><span className={styles.visuallyHidden}> (PDF, neuer Tab)</span>
    </button>
  )
}

export default function ExerciseCard({ exercise, category }) {
  const { isCompleted, toggle } = useCompletedExercises()
  const [isOpening, setIsOpening] = useState(false)
  const [openingPath, setOpeningPath] = useState('')
  const [openError, setOpenError] = useState('')
  const completed = isCompleted(exercise.id)

  const handleOpen = async path => {
    setOpenError('')
    setIsOpening(true)
    setOpeningPath(path)
    try {
      await openMaterialPdf(path)
    } catch (error) {
      console.warn('PDF konnte nicht geöffnet werden.', error)
      setOpenError('Das PDF konnte nicht geöffnet werden. Bitte versuche es erneut.')
    } finally {
      setIsOpening(false)
      setOpeningPath('')
    }
  }

  return (
    <article className={`${styles.exerciseCard} ${completed ? styles.exerciseCompleted : ''}`}>
      <div className={styles.exerciseHeading}>
        <div>
          <p className={styles.exerciseType}>{category.taskType}</p>
          <h4 className={styles.exerciseTitle}>{exercise.title}</h4>
        </div>
        {exercise.points && <span className={styles.points}>{exercise.points} P.</span>}
      </div>
      <div className={styles.exerciseActions}>
        <PdfAction path={exercise.pdfPath} label={isOpening && openingPath === exercise.pdfPath ? 'Wird geöffnet …' : 'Aufgabe öffnen'} primary onOpen={() => handleOpen(exercise.pdfPath)} disabled={isOpening} />
        <PdfAction path={exercise.evaluationPath} label={isOpening && openingPath === exercise.evaluationPath ? 'Wird geöffnet …' : 'Auswertungsbogen'} onOpen={() => handleOpen(exercise.evaluationPath)} disabled={isOpening} />
      </div>
      {openError && <p className={styles.pdfError} role="alert">{openError}</p>}
      <label className={styles.completedControl}>
        <input type="checkbox" checked={completed} onChange={() => toggle(exercise.id)} />
        <span>Erledigt · nur für diese Sitzung</span>
      </label>
    </article>
  )
}
