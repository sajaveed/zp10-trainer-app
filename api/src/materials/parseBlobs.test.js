import test from 'node:test'
import assert from 'node:assert/strict'
import { parseBlobs } from './parseBlobs.js'

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

test('ignores unsupported file types, folders, subjects and malformed prefixes', () => {
  assert.deepEqual(parseBlobs([
    'deutsch/leseverstehen/unrelated.pdf',
    'deutsch/other/deutsch_other_task_text_001.pdf',
    'englisch/leseverstehen/englisch_leseverstehen_task_text_001.pdf',
    'deutsch/leseverstehen/deutsch_leseverstehen_notes.docx',
  ]), [])
})
