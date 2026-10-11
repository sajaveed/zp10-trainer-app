import test from 'node:test'
import assert from 'node:assert/strict'
import { parseBlobs, parseBlobsDetailed } from './parseBlobs.js'

test('groups task and evaluation PDFs into one exercise per slug and category', () => {
  const tasks = parseBlobs([
    'deutsch/leseverstehen/deutsch_leseverstehen_luftverschmutzung-wenn-die-nacht-zum-tag-wird_text_001.pdf',
    'deutsch/leseverstehen/deutsch_leseverstehen_luftverschmutzung-wenn-die-nacht-zum-tag-wird-auswertungsbogen_001.pdf',
    'deutsch/4a-aufgaben/deutsch_4a-aufgaben_striche-an-der-tür_text_001.pdf',
    'deutsch/4b-aufgaben/deutsch_4b-aufgaben_ki-beim-lernen_text_001.pdf',
    'deutsch/4b-aufgaben/deutsch_4b-aufgaben_ki-beim-lernen_auswertungsbogen_001.pdf',
    'deutsch/2-aufgaben/deutsch_2-aufgaben_reparieren-statt-wegwerfen_text_001.pdf',
  ])

  assert.equal(tasks.length, 4)
  assert.equal(tasks.find(task => task.categoryId === 'typ4b').title, 'KI beim Lernen')
  assert.equal(tasks.find(task => task.categoryId === 'leseverstehen').title, 'Luftverschmutzung wenn die Nacht zum Tag Wird')
  assert.equal(tasks.find(task => task.categoryId === 'typ4a').title, 'Striche an der Tür')
  assert.equal(tasks.find(task => task.categoryId === 'typ2').title, 'Reparieren statt Wegwerfen')
  assert.ok(tasks.find(task => task.categoryId === 'typ4b').taskBlob.endsWith('_text_001.pdf'))
  assert.ok(tasks.find(task => task.categoryId === 'typ4b').evaluationBlob.endsWith('_auswertungsbogen_001.pdf'))
  assert.equal(tasks.find(task => task.categoryId === 'typ4a').evaluationBlob, null)
})

test('supports both evaluation suffix delimiters, case, transliteration and optional missing files', () => {
  const tasks = parseBlobs([
    'deutsch/4b-aufgaben/DEUTSCH_4b-aufgaben_KI-beim-Lernen-001.PDF',
    'deutsch/4b-aufgaben/deutsch_4b-aufgaben_ki-beim-lernen-AUSWERTUNGSBOGEN_001.pdf',
    'deutsch/2-aufgaben/deutsch_2-aufgaben_grosse-ueberraschung_text_003.pdf',
    'deutsch/2-aufgaben/deutsch_2-aufgaben_große-überraschung-auswertungsbogen_003.pdf',
  ])

  assert.equal(tasks.length, 2)
  const aiTask = tasks.find(task => task.categoryId === 'typ4b')
  assert.equal(aiTask.title, 'KI beim Lernen')
  assert.equal(aiTask.taskBlob, 'deutsch/4b-aufgaben/DEUTSCH_4b-aufgaben_KI-beim-Lernen-001.PDF')
  assert.ok(aiTask.evaluationBlob.endsWith('AUSWERTUNGSBOGEN_001.pdf'))
  assert.equal(tasks.find(task => task.categoryId === 'typ2').title, 'Grosse Ueberraschung')
})

test('ignores unsupported file types, folders, subjects and empty titles', () => {
  assert.deepEqual(parseBlobs([
    'deutsch/leseverstehen/deutsch_leseverstehen_text_001.pdf',
    'deutsch/other/deutsch_other_task_text_001.pdf',
    'englisch/leseverstehen/englisch_leseverstehen_task_text_001.pdf',
    'deutsch/leseverstehen/deutsch_leseverstehen_notes.docx',
  ]), [])
})

test('pairs the real uploaded filenames in all four categories, with folder taking precedence', () => {
  const pairs = [
    ['leseverstehen', 'Lichtverschmutzung',
      'deutsch/leseverstehen/deutsch_leseverstehen_lichtverschmutzung_text_001.pdf',
      'deutsch/leseverstehen/deutsch_leseverstehen_lichtverschmutzung_auswertungsbogen_001.pdf'],
    ['typ4a', 'Striche an der Tuer',
      'deutsch/4a-aufgaben/deutsch_leseverstehen_striche-an-der-tuer_text_001.pdf',
      'deutsch/4a-aufgaben/deutsch_leseverstehen_striche-an-der-tuer-auswertungsbogen-001.pdf'],
    ['typ4b', 'KI beim Lernen',
      'deutsch/4b-aufgaben/deutsch_leseverstehen_ki-beim-lernen_text_001.pdf',
      'deutsch/4b-aufgaben/deutsch_leseverstehen_ki-beim-lernen_auswertungsbogen_001.pdf'],
    ['typ2', 'Reparieren statt Wegwerfen',
      'deutsch/2-aufgaben/deutsch_reparieren-statt-wegwerfen_text_001.pdf',
      'deutsch/2-aufgaben/deutsch_reparieren-statt-wegwerfen-auswertungsbogen.pdf'],
  ]
  const { tasks, ignored } = parseBlobsDetailed(pairs.flatMap(([, , task, evaluation]) => [task, evaluation]))
  assert.equal(tasks.length, 4)
  assert.deepEqual(ignored, [])
  for (const [categoryId, title, taskBlob, evaluationBlob] of pairs) {
    const exercise = tasks.find(task => task.categoryId === categoryId)
    assert.equal(exercise.title, title)
    assert.equal(exercise.taskBlob, taskBlob)
    assert.equal(exercise.evaluationBlob, evaluationBlob)
  }
})

test('normalizes delimiters and umlauts, and selects the lowest numbered task without duplicate cards', () => {
  const taskBlob = 'deutsch/4a-aufgaben/DEUTSCH-leseverstehen-Striche_an_der_Tür-text-001.PDF'
  const evaluationBlob = 'deutsch/4a-aufgaben/deutsch_leseverstehen_striche-an-der-tuer_auswertungsbogen.pdf'
  const { tasks, ignored } = parseBlobsDetailed([
    taskBlob.replace('001', '010'),
    taskBlob.replace('001', '002'),
    evaluationBlob,
    taskBlob,
  ])
  assert.deepEqual(ignored, [])
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].id, 'deutsch-typ4a-striche-an-der-tuer')
  assert.equal(tasks[0].title, 'Striche an der Tür')
  assert.equal(tasks[0].taskBlob, taskBlob)
  assert.equal(tasks[0].evaluationBlob, evaluationBlob)
})

test('accepts optional category aliases and unprefixed titles without evaluation sheets', () => {
  for (const prefix of ['leseverstehen', '4a-aufgaben', '4b-aufgaben', '2-aufgaben',
    '4a', '4b', '2', 'typ4a', 'typ4b', 'typ2', 'aufgabentyp-4a', 'aufgabentyp_4b', 'aufgabentyp-2']) {
    for (const delimiter of ['_', '-']) {
      const path = `deutsch/2-aufgaben/deutsch${delimiter}${prefix}${delimiter}ki-beim-lernen_text001.pdf`
      const { tasks, ignored } = parseBlobsDetailed([path])
      assert.deepEqual(ignored, [])
      assert.equal(tasks[0].categoryId, 'typ2')
      assert.equal(tasks[0].title, 'KI beim Lernen')
      assert.equal(tasks[0].evaluationBlob, null)
    }
  }
  assert.equal(parseBlobs(['deutsch/leseverstehen/unrelated.pdf'])[0].title, 'Unrelated')
})

test('reports every ignored file with a reason', () => {
  const ignored = [
    { path: 'deutsch/leseverstehen/notes.docx', reason: 'not-pdf' },
    { path: 'deutsch/other/task.pdf', reason: 'unknown-folder' },
    { path: 'deutsch/toString/task.pdf', reason: 'unknown-folder' },
    { path: 'englisch/leseverstehen/task.pdf', reason: 'wrong-subject' },
    { path: 'deutsch/2-aufgaben/deutsch_typ2_auswertungsbogen.pdf', reason: 'empty-title' },
  ]
  assert.deepEqual(parseBlobsDetailed(ignored.map(item => item.path)), { tasks: [], ignored })
})
