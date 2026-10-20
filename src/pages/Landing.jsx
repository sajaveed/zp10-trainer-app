import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, FileText } from 'lucide-react'
import { useLang } from '../hooks/useLang'
import ZenoCoach from '../components/ZenoCoach'
import styles from './Landing.module.css'

const copy = {
  de: {
    eyebrow: 'Deine Vorbereitung auf die ZP10',
    slogan: ['Schreib. Lern.', 'Besteh.'],
    intro: 'Starte mit Deutsch: Prüfungsaufgaben als PDF bearbeiten und die eigene Lösung anhand der Bewertungskriterien einschätzen. Schritt für Schritt, in deinem Tempo.',
    start: 'Anmelden und Deutsch üben',
    more: 'So funktioniert es',
    available: 'Jetzt verfügbar',
    german: 'Deutsch',
    resourceTitle: 'Eine Aufgabe. Dein nächster Schritt.',
    resourceText: 'Originalaufgaben als PDF, Zeit zum Bearbeiten und Kriterien zur Selbsteinschätzung.',
    resourceItems: ['Prüfungsaufgabe herunterladen', 'Eigenständig bearbeiten', 'Mit Bewertungskriterien abgleichen'],
    resourceNote: 'Keine automatische Benotung. Du bewertest deine Lösung selbst.',
    howLabel: 'Dein Lernweg',
    howTitle: 'Vom Aufgabenblatt zur Selbsteinschätzung.',
    howIntro: 'Du brauchst keine fertige Antwort. Nur einen Anfang.',
    steps: [
      ['Aufgabe auswählen', 'Melde dich an und öffne im Fach Deutsch eine Prüfungsaufgabe als PDF.'],
      ['In Ruhe bearbeiten', 'Schreibe deine Lösung auf Papier oder in deinem eigenen Dokument.'],
      ['Lösung reflektieren', 'Nutze die Bewertungskriterien zur Selbsteinschätzung: Was gelingt schon, was möchtest du weiter üben?'],
    ],
    subjectsLabel: 'Fächer & Verfügbarkeit',
    subjectsTitle: 'Klar sehen, was du heute nutzen kannst.',
    subjectsIntro: 'Deutsch ist der Anfang. Weitere Fächer und Funktionen werden entwickelt.',
    subjects: [
      ['Deutsch', 'Verfügbar', 'Prüfungs-PDFs und Selbsteinschätzung mit Bewertungskriterien.', true],
      ['Mathematik', 'In Entwicklung', 'Übungsangebote für Mathematik sind noch nicht verfügbar.', false],
      ['Englisch', 'In Entwicklung', 'Übungsangebote für Englisch sind noch nicht verfügbar.', false],
    ],
    zenoLabel: 'Ein Blick nach vorn',
    zenoTitle: 'Zeno: eine Idee für deinen Lernbegleiter.',
    zenoIntro: 'KI-Feedback und Fortschrittsübersichten sind in Entwicklung. Die Vorschau zeigt nur einen beispielhaften Chat, keine echte KI-Bewertung.',
    faqLabel: 'Gut zu wissen',
    faqTitle: 'Fragen vor dem Start?',
    faq: [
      ['Was kann ich aktuell nutzen?', 'Im Fach Deutsch stehen Prüfungsaufgaben als PDF und Bewertungskriterien zur Selbsteinschätzung bereit. Mathematik, Englisch, KI-Feedback und Fortschrittsübersichten sind in Entwicklung.'],
      ['Wie starte ich?', 'Melde dich an oder erstelle ein Konto. Wähle anschließend Deutsch und öffne eine Prüfungsaufgabe.'],
      ['Wird meine Lösung automatisch bewertet?', 'Nein. Aktuell vergleichst du deine Lösung selbst mit den Bewertungskriterien. Eine automatische KI-Bewertung ist nicht verfügbar.'],
      ['Was passiert in der Zeno-Demo mit meinen Dateien?', 'Die Demo zeigt nur ausgewählte Dateinamen an. Dateien werden weder hochgeladen noch gelesen oder analysiert. Die Antworten sind vorgegeben.'],
      ['Ersetzt das Angebot meinen Unterricht?', 'Nein. Nutze die Aufgaben ergänzend zum Unterricht. Bei fachlichen Fragen und zur verbindlichen Bewertung hilft dir deine Lehrkraft.'],
    ],
  },
  en: {
    eyebrow: 'Your preparation for the ZP10 exams',
    slogan: ['Write. Learn.', 'Pass.'],
    intro: 'Start with German: work through exam PDFs and assess your own answer using the marking criteria. Step by step, at your own pace.',
    start: 'Sign in and practise German',
    more: 'How it works',
    available: 'Available now',
    german: 'German',
    resourceTitle: 'One task. Your next step.',
    resourceText: 'Original exam PDFs, time to work independently and criteria for self-assessment.',
    resourceItems: ['Download an exam task', 'Write your own answer', 'Compare with the marking criteria'],
    resourceNote: 'No automatic grading. You assess your own answer.',
    howLabel: 'Your learning path',
    howTitle: 'From exam paper to self-assessment.',
    howIntro: 'You do not need a finished answer. Just a place to start.',
    steps: [
      ['Choose a task', 'Sign in and open a German exam task as a PDF.'],
      ['Work at your own pace', 'Write your answer on paper or in your own document.'],
      ['Reflect on your answer', 'Use the marking criteria for self-assessment: what is working, and what would you like to practise next?'],
    ],
    subjectsLabel: 'Subjects & availability',
    subjectsTitle: 'Know what you can use today.',
    subjectsIntro: 'German is the starting point. More subjects and features are in development.',
    subjects: [
      ['German', 'Available', 'Exam PDFs and self-assessment using marking criteria.', true],
      ['Mathematics', 'In development', 'Mathematics practice is not available yet.', false],
      ['English', 'In development', 'English practice is not available yet.', false],
    ],
    zenoLabel: 'Looking ahead',
    zenoTitle: 'Zeno: an idea for your learning companion.',
    zenoIntro: 'AI feedback and progress summaries are in development. This preview is only an example conversation, not real AI assessment.',
    faqLabel: 'Good to know',
    faqTitle: 'Questions before you start?',
    faq: [
      ['What is available now?', 'German exam PDFs and marking criteria for self-assessment are available. Mathematics, English, AI feedback and progress summaries are in development.'],
      ['How do I get started?', 'Sign in or create an account. Then choose German and open an exam task.'],
      ['Is my answer graded automatically?', 'No. You currently compare your own answer with the marking criteria. Automatic AI assessment is not available.'],
      ['What happens to files in the Zeno demo?', 'The demo only displays selected filenames. Files are not uploaded, read or analysed. Replies are predefined.'],
      ['Does this replace my lessons?', 'No. Use the tasks alongside your lessons. Ask your teacher for subject guidance and formal assessment.'],
    ],
  },
}

export default function Landing({ onAuthClick }) {
  const { lang, t } = useLang()
  const c = copy[lang] || copy.de
  const [hashError] = useState(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    if (!params.get('error')) return null
    return {
      error: params.get('error'),
      errorCode: params.get('error_code'),
      errorDescription: params.get('error_description'),
    }
  })
  const [errorDismissed, setErrorDismissed] = useState(false)

  useEffect(() => {
    if (hashError) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [hashError])

  let authError = null
  if (hashError && !errorDismissed) {
    authError = hashError.errorCode === 'otp_expired'
      ? t.auth.linkExpired
      : hashError.error === 'access_denied'
        ? t.auth.linkError
        : hashError.errorDescription || t.auth.linkErrorGeneric
  }

  return (
    <>
      {authError && (
        <div className={styles.errorBanner} role="alert">
          <span>{authError}</span>
          <button type="button" onClick={() => setErrorDismissed(true)} aria-label={t.auth.close}>×</button>
        </div>
      )}
      <main className={styles.page} id="main-content">
        <section className={styles.hero} id="home" aria-labelledby="landing-title">
          <div className={styles.heroCopy}>
            <p className={styles.label}>{c.eyebrow}</p>
            <h1 id="landing-title" className={styles.heroTitle}>{c.slogan[0]}<br /><span>{c.slogan[1]}</span></h1>
            <p className={styles.heroIntro}>{c.intro}</p>
            <div className={styles.heroActions}>
              <button type="button" className={`ui-button ${styles.primaryButton}`} onClick={onAuthClick}>{c.start}<ArrowRight size={18} aria-hidden="true" /></button>
              <a className={styles.secondaryLink} href="#how">{c.more}</a>
            </div>
          </div>
          <aside className={styles.resource} aria-labelledby="resource-title">
            <div className={styles.resourceTop}><BookOpen size={24} aria-hidden="true" /><span className={styles.status}>{c.available}</span></div>
            <p className={styles.resourceSubject}>{c.german} / ZP10</p>
            <h2 id="resource-title">{c.resourceTitle}</h2>
            <p>{c.resourceText}</p>
            <ol className={styles.resourceList}>{c.resourceItems.map(item => <li key={item}>{item}</li>)}</ol>
            <p className={styles.resourceNote}><FileText size={16} aria-hidden="true" />{c.resourceNote}</p>
          </aside>
        </section>

        <section className={styles.section} id="how" aria-labelledby="how-title">
          <p className={styles.label}>{c.howLabel}</p>
          <h2 className={styles.sectionTitle} id="how-title">{c.howTitle}</h2>
          <p className={styles.sectionIntro}>{c.howIntro}</p>
          <ol className={styles.steps}>
            {c.steps.map(([title, text], index) => (
              <li key={title}><span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{text}</p></li>
            ))}
          </ol>
        </section>

        <section className={styles.section} id="subjects" aria-labelledby="subjects-title">
          <p className={styles.label}>{c.subjectsLabel}</p>
          <h2 className={styles.sectionTitle} id="subjects-title">{c.subjectsTitle}</h2>
          <p className={styles.sectionIntro}>{c.subjectsIntro}</p>
          <div className={styles.subjects}>
            {c.subjects.map(([name, status, description, available]) => (
              <article className={styles.subject} key={name}>
                <div className={styles.subjectHeading}><h3>{name}</h3><span className={available ? styles.status : styles.plannedStatus}>{status}</span></div>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.previewSection} id="ki" aria-labelledby="zeno-title">
          <div className={styles.previewInner}>
            <div>
              <p className={styles.label}>{c.zenoLabel}</p>
              <h2 className={styles.sectionTitle} id="zeno-title">{c.zenoTitle}</h2>
              <p className={styles.sectionIntro}>{c.zenoIntro}</p>
            </div>
            <div id="zeno-demo" className={styles.preview}><ZenoCoach /></div>
          </div>
        </section>

        <section className={styles.section} id="faq" aria-labelledby="faq-title">
          <p className={styles.label}>{c.faqLabel}</p>
          <h2 className={styles.sectionTitle} id="faq-title">{c.faqTitle}</h2>
          <div className={styles.faqList}>
            {c.faq.map(([question, answer]) => (
              <details className={styles.faqItem} key={question}><summary>{question}</summary><p>{answer}</p></details>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
