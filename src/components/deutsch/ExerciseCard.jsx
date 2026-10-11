import { useState } from 'react'
import { openMaterialPdf } from '../../lib/materialsApi'
import { useCompletedExercises } from '../../hooks/useCompletedExercises'
import styles from '../../pages/Deutsch.module.css'

function PdfAction({ path, label, icon, onOpen, disabled }) {
  if (!path) {
    return (
      <button type="button" className={`${styles.pdfButton} ${styles.pdfButtonDisabled}`} disabled>
        <span aria-hidden="true">{icon}</span>{label}
        <span className={styles.pdfFollow}>PDF folgt</span>
      </button>
    )
  }

  return (
    <button type="button" className={styles.pdfButton} onClick={onOpen} disabled={disabled}>
      <span aria-hidden="true">{icon}</span>{label}
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
        <PdfAction path={exercise.pdfPath} label={isOpening && openingPath === exercise.pdfPath ? 'Wird geöffnet …' : 'Aufgabe öffnen'} icon="📄" onOpen={() => handleOpen(exercise.pdfPath)} disabled={isOpening} />
        <PdfAction path={exercise.evaluationPath} label={isOpening && openingPath === exercise.evaluationPath ? 'Wird geöffnet …' : 'Auswertungsbogen'} icon="📋" onOpen={() => handleOpen(exercise.evaluationPath)} disabled={isOpening} />
      </div>
      {openError && <p className={styles.pdfError} role="alert">{openError}</p>}
      <label className={styles.completedControl}>
        <input type="checkbox" checked={completed} onChange={() => toggle(exercise.id)} />
        <span>{completed ? '✓ Erledigt' : 'Als erledigt markieren'}</span>
      </label>
    </article>
  )
}
