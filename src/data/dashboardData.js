export const examDates = [
  { subject: 'Deutsch', date: '2027-05-11T09:00:00' },
  { subject: 'Englisch', date: '2027-05-13T09:00:00' },
  { subject: 'Mathematik', date: '2027-05-20T09:00:00' },
]

export const subjectProgress = [
  { subject: 'Deutsch', progress: 70, path: '/deutsch', icon: '📝' },
  { subject: 'Mathematik', progress: 60, path: '/mathematik', icon: '📐' },
  { subject: 'Englisch', progress: 55, path: '/englisch', icon: '🌍' },
]

export const overallProgress = 62

export const lastActivity = { subject: 'Deutsch', topic: 'Leseverstehen' }

/** Topics shown on the subject pages */
export const subjectTopics = {
  deutsch: [
    { id: 'leseverstehen',    emoji: '📖', title: 'Leseverstehen',           desc: 'Texte erschließen, Aussagen belegen, Aufgaben nach ZP10-Raster lösen.' },
    { id: 'argumentation',    emoji: '✍️', title: 'Argumentation',           desc: 'Eigene Meinungen strukturiert und überzeugend formulieren.' },
    { id: 'stellungnahme',    emoji: '💬', title: 'Stellungnahme',           desc: 'Stellung nehmen mit These, Belegen und Schlussfolgerung.' },
    { id: 'analyse',          emoji: '🔍', title: 'Textanalyse',             desc: 'Sachtexte und literarische Texte analysieren und interpretieren.' },
    { id: 'zusammenfassung',  emoji: '📋', title: 'Zusammenfassung',         desc: 'Kernaussagen eines Textes präzise und sachlich wiedergeben.' },
    { id: 'sprache',          emoji: '🔠', title: 'Sprachreflexion',         desc: 'Grammatik, Satzbau, Stilmittel – Sprache bewusst einsetzen.' },
  ],
  englisch: [
    { id: 'reading',          emoji: '📄', title: 'Reading Comprehension',   desc: 'Verstehen, interpretieren und auf englische Texte antworten.' },
    { id: 'listening',        emoji: '🎧', title: 'Listening',               desc: 'Hörverstehen: Inhalte erfassen und Fragen beantworten.' },
    { id: 'comment',          emoji: '💭', title: 'Comment / Opinion',       desc: 'Meinungstexte auf Englisch strukturiert verfassen.' },
    { id: 'mediation',        emoji: '🔁', title: 'Mediation',               desc: 'Inhalte zwischen Deutsch und Englisch sinngemäß übertragen.' },
    { id: 'vocabulary',       emoji: '📚', title: 'Vocabulary',              desc: 'ZP10-relevanten Wortschatz erweitern und festigen.' },
    { id: 'grammar',          emoji: '🔤', title: 'Grammar',                 desc: 'Tenses, conditionals, reported speech und mehr.' },
  ],
  mathematik: [
    { id: 'funktionen',       emoji: '📈', title: 'Funktionen',              desc: 'Lineare, quadratische und weitere Funktionen verstehen und darstellen.' },
    { id: 'geometrie',        emoji: '📐', title: 'Geometrie',               desc: 'Figuren, Sätze und Berechnungen zu Flächen und Körpern.' },
    { id: 'wahrscheinlichkeit', emoji: '🎲', title: 'Wahrscheinlichkeit',    desc: 'Laplace-Experimente, Baumdiagramme und bedingte Wahrscheinlichkeit.' },
    { id: 'algebra',          emoji: '🧮', title: 'Algebra',                 desc: 'Terme, Gleichungen und Ungleichungen lösen.' },
    { id: 'sachaufgaben',     emoji: '📝', title: 'Sachaufgaben',            desc: 'Reale Kontexte mathematisch modellieren und berechnen.' },
    { id: 'statistik',        emoji: '📊', title: 'Statistik',               desc: 'Daten auswerten, Diagramme lesen und Kennwerte berechnen.' },
  ],
}
