// PDFs gehören in public/ (z. B. /pdfs/deutsch/aufgabe.pdf). Neue Übungen als Eintrag ergänzen;
// pdfPath und evaluationPath bleiben bis zum Hochladen der Dateien null.
export const DEUTSCH_CATEGORIES = [
  { id: 'leseverstehen', title: 'Leseverstehen', icon: '📖', taskType: 'Teil 1 · Leseverstehen' },
  { id: 'typ4a', title: 'Aufgabentyp 4a – Literarische Analyse', icon: '✍️', taskType: 'Aufgabentyp 4a · Literarische Analyse' },
  { id: 'typ4b', title: 'Aufgabentyp 4b – Vergleichendes Schreiben', icon: '🔎', taskType: 'Aufgabentyp 4b · Vergleichendes Schreiben' },
  { id: 'typ2', title: 'Aufgabentyp 2 – Informierendes Schreiben', icon: '📰', taskType: 'Aufgabentyp 2 · Informierendes Schreiben' },
]

export const DEUTSCH_EXERCISES = [
  { id: 'lese-lichtverschmutzung', title: 'Lichtverschmutzung', category: 'leseverstehen', points: 15, pdfPath: null, evaluationPath: null },
  { id: '4a-striche-an-der-tuer', title: 'Striche an der Tür', category: 'typ4a', points: 60, pdfPath: null, evaluationPath: null },
  { id: '4b-ki-beim-lernen', title: 'KI beim Lernen', category: 'typ4b', points: 60, pdfPath: null, evaluationPath: null },
  { id: '2-reparieren-statt-wegwerfen', title: 'Reparieren statt Wegwerfen', category: 'typ2', points: 60, pdfPath: null, evaluationPath: null },
]
