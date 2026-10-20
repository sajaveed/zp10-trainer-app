import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ExerciseCard from './ExerciseCard'
import styles from '../../pages/Deutsch.module.css'

export default function ExerciseAccordion({ category, materials = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()

  return (
    <section className={`${styles.accordion} ${isOpen ? styles.accordionOpen : ''}`}>
      <h3 className={styles.accordionHeading}>
        <button
          type="button"
          className={styles.accordionButton}
          id={`${panelId}-heading`}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(open => !open)}
        >
          <span className={styles.categoryTitle}>{category.title}</span>
          <span className={styles.categoryCount}>{materials.length} {materials.length === 1 ? 'Übung' : 'Übungen'}</span>
          <ChevronDown className={styles.chevron} size={18} aria-hidden="true" />
        </button>
      </h3>
      <div
        className={styles.accordionPanel}
        id={panelId}
        role="region"
        aria-labelledby={`${panelId}-heading`}
        hidden={!isOpen}
      >
        <div className={styles.accordionContent}>
          {materials.length > 0 ? (
            <div className={styles.exerciseGrid}>
              {materials.map(exercise => (
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
