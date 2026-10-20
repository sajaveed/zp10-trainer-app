import styles from '../../pages/Deutsch.module.css'

const writingTasks = [
  {
    title: 'Aufgabentyp 4a – Literarische Analyse',
    description: 'Einen literarischen Text analysieren und interpretieren. Dabei werden beispielsweise Figuren, Beziehungen, Erzählweise und sprachliche Mittel untersucht.',
  },
  {
    title: 'Aufgabentyp 4b – Untersuchendes und vergleichendes Schreiben',
    description: 'Informationen aus verschiedenen Texten oder Materialien ermitteln, vergleichen, deuten und bewerten.',
  },
  {
    title: 'Aufgabentyp 2 – Materialgestütztes informierendes Schreiben',
    description: 'Aus verschiedenen Materialien einen eigenständigen, strukturierten und informierenden Text erstellen.',
  },
]

export default function ExamOverview() {
  return (
    <section className={styles.overview} aria-labelledby="overview-title">
        <div className={styles.sectionHeading}>
          <div>
            <h3 id="overview-title" className={styles.sectionTitle}>So ist die Deutsch-ZP10 aufgebaut</h3>
          </div>
          <p className={styles.sectionDescription}>
            Die zentrale Deutschprüfung der Klasse 10 am Gymnasium in NRW besteht aus zwei Prüfungsteilen.
          </p>
        </div>

        <div className={styles.partsGrid}>
          <article className={styles.partCard}>
            <h3 className={styles.cardTitle}>Teil 1 – Leseverstehen</h3>
            <div className={styles.metrics}>
              <span><strong>30 Min.</strong> reguläre Bearbeitungszeit</span>
              <span><strong>15 Punkte</strong> erreichbar</span>
            </div>
            <p>Ein Sachtext mit verschiedenen Aufgaben, z. B. Multiple Choice, Zuordnungen, Erläuterungen und kurze Stellungnahmen.</p>
          </article>
          <article className={styles.partCard}>
            <h3 className={styles.cardTitle}>Teil 2 – Schreiben</h3>
            <div className={styles.metrics}>
              <span><strong>120 Min.</strong> reguläre Bearbeitungszeit</span>
              <span><strong>60 Punkte</strong> erreichbar</span>
            </div>
            <p>Zwei Wahlaufgaben, von denen nur eine bearbeitet wird.</p>
          </article>
        </div>

        <div className={styles.taskGrid}>
          {writingTasks.map(task => (
            <article className={styles.taskCard} key={task.title}>
              <h3 className={styles.cardTitle}>{task.title}</h3>
              <p>{task.description}</p>
            </article>
          ))}
        </div>

        <div className={styles.note}>
          <p><strong>Wichtig:</strong> Die erste Wahlaufgabe ist Aufgabentyp 4a. Die zweite Wahlaufgabe ist entweder Aufgabentyp 2 oder 4b.</p>
        </div>
      <div className={styles.timeManagement}>
        <h3 className={styles.cardTitle}>Zeitmanagement</h3>
        <p>Zusätzlich gibt es 10 Minuten Auswahlzeit und 10 Minuten Bonuszeit.</p>
        <ul className={styles.timeList}>
          <li><strong>30 Min.</strong> Leseverstehen</li>
          <li><strong>120 Min.</strong> Schreiben</li>
          <li><strong>10 Minuten</strong> Auswahlzeit</li>
          <li><strong>10 Minuten</strong> Bonuszeit</li>
        </ul>
      </div>
    </section>
  )
}
