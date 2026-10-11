import { useId, useState } from 'react'
import { DEUTSCH_EXERCISES } from '../../data/deutschExercises'
import ExerciseCard from './ExerciseCard'
import styles from '../../pages/Deutsch.module.css'

export default function ExerciseAccordion({ category }) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  const exercises = DEUTSCH_EXERCISES.filter(exercise => exercise.category === category.id)

  return (
    <section className={`${styles.accordion} ${isOpen ? styles.accordionOpen : ''}`}>
      <h3 className={styles.accordionHeading}>
        <button
          type="button"
          className={styles.accordionButton}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(open => !open)}
        >
          <span className={styles.categoryIcon} aria-hidden="true">{category.icon}</span>
          <span className={styles.categoryTitle}>{category.title}</span>
          <span className={styles.categoryCount}>{exercises.length}</span>
          <span className={styles.chevron} aria-hidden="true">⌄</span>
        </button>
      </h3>
      <div
        className={styles.accordionPanel}
        id={panelId}
        role="region"
        aria-labelledby={`${panelId}-heading`}
        aria-hidden={!isOpen}
      >
        <span id={`${panelId}-heading`} className={styles.visuallyHidden}>{category.title}</span>
        <div className={styles.accordionContent}>
          {exercises.length > 0 ? (
            <div className={styles.exerciseGrid}>
              {exercises.map(exercise => (
                <ExerciseCard key={exercise.id} exercise={exercise} category={category} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>Für diese Kategorie sind noch keine Übungen verfügbar.</p>
          )}
        </div>
      </div>
    </section>
  )
}
