import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, FileText } from 'lucide-react'
import { useLang } from '../hooks/useLang'
import ZenoCoach from '../components/ZenoCoach'
import styles from './Landing.module.css'

const copy = {
  de: {
    eyebrow: 'ZP10-Vorbereitung · NRW · Klasse 10',
    slogan: ['Schreib. Lern.', 'Besteh.'],
    intro: 'Dein Lernort für die ZP10 in Deutsch, Mathematik und Englisch. Schritt für Schritt, in deinem Tempo – mit Zeno als geplantem KI-Lerncoach an deiner Seite.',
    start: 'Jetzt starten',
    more: 'So funktioniert’s',
    subjectOverview: 'Deutsch · Mathematik · Englisch',
    resourceTitle: 'Eine Aufgabe. Dein nächster Schritt.',
    resourceText: 'Fach auswählen, Aufgaben bearbeiten und gezielt weiterlernen.',
    resourceItems: ['Dein Fach und eine Aufgabe wählen', 'In deinem Tempo bearbeiten', 'Lösung auswerten und nächste Schritte finden'],
    resourceNote: 'Selbstkontrolle mit Auswertungsbögen; KI-gestützte Bewertung durch Zeno ist geplant.',
    howLabel: 'Dein Lernweg',
    howTitle: 'Von der Aufgabe zum nächsten Lernschritt.',
    howIntro: 'Du brauchst keine fertige Antwort. Nur einen Anfang.',
    steps: [
      ['Fach und Aufgabe auswählen', 'Melde dich an und entdecke die Fächer. Aktuell stehen Deutsch-Übungen als PDF bereit.'],
      ['In Ruhe bearbeiten', 'Schreibe deine Lösung auf Papier oder in deinem eigenen Dokument.'],
      ['Lösung reflektieren', 'Nutze die Auswertungsbögen zur Selbstkontrolle. Als zweiter Weg ist KI-gestützte Bewertung durch Zeno geplant.'],
    ],
    subjectsLabel: 'Deine Fächer',
    subjectsTitle: 'Drei Fächer. Ein Lernort.',
    subjectsIntro: 'Deutsch, Mathematik und Englisch gehören zusammen zu deiner ZP10-Vorbereitung. Das Lernangebot wird schrittweise ergänzt.',
    subjects: [
      ['Deutsch', 'Texte verstehen, argumentieren und eigene Gedanken klar formulieren.'],
      ['Mathematik', 'Funktionen, Geometrie und Wahrscheinlichkeit: Rechenwege verstehen und Lösungen begründen.'],
      ['Englisch', 'Texte verstehen, Wortschatz erweitern und eigene Gedanken auf Englisch ausdrücken.'],
    ],
    zenoLabel: 'Dein KI-Lerncoach',
    zenoTitle: 'Zeno gehört zu deinem Lernweg.',
    zenoIntro: 'Als fester Bestandteil der Plattform ist Zeno für alle drei Fächer geplant: Fragen klären, Lösungen reflektieren und mit KI-gestütztem Feedback gezielt weiterlernen.',
    faqLabel: 'Gut zu wissen',
    faqTitle: 'Fragen vor dem Start?',
    faq: [
      ['Was kann ich aktuell nutzen?', 'Im Fach Deutsch stehen ZP10-Übungen als PDF und Auswertungsbögen zur Selbstkontrolle bereit. Mathematik, Englisch, KI-Feedback und Fortschrittsübersichten sind in Entwicklung.'],
      ['Wie starte ich?', 'Melde dich an oder erstelle ein Konto. Wähle anschließend dein Fach. Aktuell kannst du Deutsch-Aufgaben öffnen; Mathematik und Englisch folgen.'],
      ['Wie kann ich meine Lösung auswerten?', 'Es sind zwei Wege vorgesehen: Selbstkontrolle mit Auswertungsbögen und KI-gestützte Bewertung durch Zeno. Aktuell kannst du die Auswertungsbögen nutzen; Zeno ist noch nicht angebunden.'],
      ['Was passiert in der Zeno-Demo mit meinen Dateien?', 'Die Demo zeigt nur ausgewählte Dateinamen an. Dateien werden weder hochgeladen noch gelesen oder analysiert. Die Antworten sind vorgegeben.'],
      ['Ersetzt das Angebot meinen Unterricht?', 'Nein. Nutze die Aufgaben ergänzend zum Unterricht. Bei fachlichen Fragen und zur verbindlichen Bewertung hilft dir deine Lehrkraft.'],
    ],
  },
  en: {
    eyebrow: 'ZP10 preparation · NRW · Grade 10',
    slogan: ['Write. Learn.', 'Pass.'],
    intro: 'Your learning space for ZP10 German, Mathematics and English. Step by step, at your own pace – with Zeno as your planned AI learning coach.',
    start: 'Get started',
    more: 'How it works',
    subjectOverview: 'German · Mathematics · English',
    resourceTitle: 'One task. Your next step.',
    resourceText: 'Choose a subject, work through tasks and take your next learning step.',
    resourceItems: ['Choose your subject and a task', 'Work at your own pace', 'Review your answer and find your next steps'],
    resourceNote: 'Self-check with evaluation sheets; AI-supported assessment by Zeno is planned.',
    howLabel: 'Your learning path',
    howTitle: 'From a task to your next learning step.',
    howIntro: 'You do not need a finished answer. Just a place to start.',
    steps: [
      ['Choose a subject and task', 'Sign in and explore the subjects. German practice PDFs are currently available.'],
      ['Work at your own pace', 'Write your answer on paper or in your own document.'],
      ['Reflect on your answer', 'Use evaluation sheets for self-checking. AI-supported assessment by Zeno is planned as a second path.'],
    ],
    subjectsLabel: 'Your subjects',
    subjectsTitle: 'Three subjects. One learning space.',
    subjectsIntro: 'German, Mathematics and English all belong in your ZP10 preparation. Learning resources are being added step by step.',
    subjects: [
      ['German', 'Understand texts, build arguments and express your ideas clearly.'],
      ['Mathematics', 'Functions, geometry and probability: understand methods and explain solutions.'],
      ['English', 'Understand texts, build vocabulary and express your ideas in English.'],
    ],
    zenoLabel: 'Your AI learning coach',
    zenoTitle: 'Zeno belongs on your learning journey.',
    zenoIntro: 'Zeno is planned as an integral part of the platform across all three subjects: ask questions, reflect on solutions and take your next steps with AI-supported feedback.',
    faqLabel: 'Good to know',
    faqTitle: 'Questions before you start?',
    faq: [
      ['What is available now?', 'German ZP10 practice PDFs and evaluation sheets for self-checking are available. Mathematics, English, AI feedback and progress summaries are in development.'],
      ['How do I get started?', 'Sign in or create an account, then choose your subject. You can currently open German tasks; Mathematics and English will follow.'],
      ['How can I review my answer?', 'Two paths are planned: self-checking with evaluation sheets and AI-supported assessment by Zeno. Evaluation sheets are available now; Zeno is not connected yet.'],
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
            <div className={styles.resourceTop}><BookOpen size={24} aria-hidden="true" /></div>
            <p className={styles.resourceSubject}>{c.subjectOverview}</p>
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
            {c.subjects.map(([name, description]) => (
              <article className={styles.subject} key={name}>
                <div className={styles.subjectHeading}><h3>{name}</h3></div>
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
