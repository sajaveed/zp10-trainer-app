import { useEffect, useMemo, useState } from 'react'
import styles from './ZenoCoach.module.css'

const mockMessages = [
  {
    role: 'zeno',
    name: 'Zeno',
    text: 'Hi! Ich bin Zeno – dein Lerncoach. Lade eine Aufgabe oder schreibe eine Antwort, und ich zeige dir, wie du dich verbessern kannst.',
  },
  {
    role: 'student',
    name: 'Du',
    text: 'Kannst du meine Argumentation prüfen?',
  },
  {
    role: 'zeno',
    name: 'Zeno',
    text: 'Klar. Ich achte auf These, Belege, Struktur und Sprache. Später kann ich deine ZP10-spezifischen Kriterien bewerten.',
  },
]

function AttachmentChip({ label }) {
  return <span className={styles.attachmentChip}>{label}</span>
}

export default function ZenoCoach() {
  const [thinking, setThinking] = useState(true)
  const attachments = useMemo(() => ['Aufgabe.pdf', 'Antwort.docx', 'Bild.png'], [])

  useEffect(() => {
    const timer = setTimeout(() => setThinking(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className={styles.wrapper} id="zeno">
      <div className={styles.header}>
        <div className={styles.avatarWrap} aria-hidden="true">
          <div className={styles.avatar}>Z</div>
          <div className={styles.statusDot} />
        </div>
        <div>
          <p className={styles.kicker}>Dein Lerncoach</p>
          <h2 className={styles.title}>Zeno</h2>
          <p className={styles.subtitle}>Feedback, Bilder und Anhänge – erstmal als Frontend-Mockup.</p>
        </div>
      </div>

      <div className={styles.chat}>
        {mockMessages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`${styles.messageRow} ${msg.role === 'student' ? styles.studentRow : styles.zenoRow}`}
          >
            <div className={msg.role === 'student' ? styles.studentBubble : styles.zenoBubble}>
              <div className={styles.messageName}>{msg.name}</div>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {thinking && (
          <div className={styles.zenoRow}>
            <div className={styles.zenoBubble}>
              <div className={styles.messageName}>Zeno</div>
              <p>Analysiere Antwort…</p>
              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.attachments}>
        <div className={styles.sectionLabel}>Anhänge</div>
        <div className={styles.chips}>
          {attachments.map(item => (
            <AttachmentChip key={item} label={item} />
          ))}
        </div>
      </div>

      <div className={styles.inputBar}>
        <div className={styles.fakeInput}>Schreibe an Zeno…</div>
        <button type="button" className={styles.sendButton}>Senden</button>
      </div>
    </section>
  )
}
