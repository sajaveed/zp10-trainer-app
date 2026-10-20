import { useEffect, useId, useRef, useState } from 'react'
import { ArrowUp, Paperclip, X } from 'lucide-react'
import { useLang } from '../hooks/useLang'
import styles from './ZenoCoach.module.css'

const copy = {
  de: {
    kicker: 'Chat-Vorschau',
    badge: 'Demo · In Entwicklung',
    subtitle: 'Beispielantworten, keine echte KI.',
    initial: 'Dies ist eine Demo. Hier kannst du den Chat ausprobieren; meine Antworten sind vorgegeben.',
    question: 'Wie kann ich meine Argumentation überprüfen?',
    example: 'Ein möglicher Selbstcheck: Ist deine These klar? Hast du ein passendes Beispiel genannt und erklärt, warum es deine These stützt?',
    reply: 'Demo-Antwort: Prüfe, ob These, Begründung und Beispiel zusammenpassen. Das ist ein allgemeiner Hinweis, keine Analyse deiner Nachricht oder Dateien.',
    chat: 'Zeno-Demounterhaltung',
    student: 'Du',
    pending: 'Demo-Antwort wird angezeigt …',
    selected: 'Nur lokal ausgewählt:',
    remove: 'Datei entfernen:',
    attach: 'Dateien lokal für die Demo auswählen',
    placeholder: 'Demo-Nachricht schreiben …',
    input: 'Deine Demo-Nachricht',
    send: 'Demo-Nachricht senden',
    disclaimer: 'Nur eine Demo: keine KI-Verbindung. Nachrichten bleiben in dieser Ansicht. Dateien werden nicht hochgeladen, gelesen oder analysiert.',
    fileNames: 'Ausgewählte Dateinamen',
  },
  en: {
    kicker: 'Chat preview',
    badge: 'Demo · In development',
    subtitle: 'Example replies, not real AI.',
    initial: 'This is a demo. You can try the chat here; my replies are predefined.',
    question: 'How can I check my argument?',
    example: 'One possible self-check: is your main claim clear? Have you given a relevant example and explained why it supports your claim?',
    reply: 'Demo reply: check whether your claim, reasoning and example fit together. This is general guidance, not an analysis of your message or files.',
    chat: 'Zeno demo conversation',
    student: 'You',
    pending: 'Showing a demo reply …',
    selected: 'Selected locally only:',
    remove: 'Remove file:',
    attach: 'Select local files for the demo',
    placeholder: 'Write a demo message …',
    input: 'Your demo message',
    send: 'Send demo message',
    disclaimer: 'Demo only: no AI connection. Messages stay in this view. Files are not uploaded, read or analysed.',
    fileNames: 'Selected filenames',
  },
}

const initialMessages = [
  { id: 'initial', role: 'zeno', copyKey: 'initial' },
  { id: 'question', role: 'student', copyKey: 'question' },
  { id: 'example', role: 'zeno', copyKey: 'example' },
]

export default function ZenoCoach({ popup = false }) {
  const { lang } = useLang()
  const c = copy[lang] || copy.de
  const id = useId()
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [thinking, setThinking] = useState(false)
  const [attachments, setAttachments] = useState([])
  const fileInputRef = useRef(null)
  const chatWindowRef = useRef(null)
  const replyTimer = useRef(null)
  const sequence = useRef(0)

  useEffect(() => () => clearTimeout(replyTimer.current), [])

  useEffect(() => {
    const chat = chatWindowRef.current
    if (chat) chat.scrollTop = chat.scrollHeight
  }, [messages, thinking])

  function handleSend(event) {
    event?.preventDefault()
    const text = inputValue.trim()
    if (replyTimer.current !== null || (!text && attachments.length === 0)) return
    sequence.current += 1
    const messageId = sequence.current
    setMessages(previous => [...previous, { id: `student-${messageId}`, role: 'student', text, files: attachments }])
    setInputValue('')
    setAttachments([])
    setThinking(true)
    replyTimer.current = setTimeout(() => {
      setMessages(previous => [...previous, { id: `reply-${messageId}`, role: 'zeno', copyKey: 'reply' }])
      setThinking(false)
      replyTimer.current = null
    }, 650)
  }

  function handleFileChange(event) {
    // Keep filenames only: the demo never reads or transmits file contents.
    const names = Array.from(event.target.files || [], file => file.name)
    setAttachments(previous => [...new Set([...previous, ...names])])
    event.target.value = ''
  }

  return (
    <section className={`${styles.wrapper} ${popup ? styles.popupWrapper : ''}`} aria-labelledby={`${id}-title`}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <p className={styles.kicker}>{c.kicker}</p>
          <h2 className={styles.title} id={`${id}-title`}>Zeno</h2>
          <p className={styles.subtitle}>{c.subtitle}</p>
        </div>
        <span className={styles.headerBadge}>{c.badge}</span>
      </header>

      <div className={styles.chatWindow} ref={chatWindowRef} role="log" aria-live="polite" aria-label={c.chat} tabIndex={0}>
        {messages.map(message => (
          <div className={`${styles.messageRow} ${message.role === 'student' ? styles.studentRow : ''}`} key={message.id}>
            <div className={`${styles.bubble} ${message.role === 'student' ? styles.studentBubble : ''}`}>
              <span className={styles.speaker}>{message.role === 'zeno' ? 'Zeno' : c.student}</span>
              {(message.copyKey || message.text) && <p>{message.copyKey ? c[message.copyKey] : message.text}</p>}
              {message.files?.length > 0 && (
                <div className={styles.messageFiles}><span>{c.fileNames}:</span><ul>{message.files.map(name => <li key={name}>{name}</li>)}</ul></div>
              )}
            </div>
          </div>
        ))}
        {thinking && <p className={styles.pending}>{c.pending}</p>}
      </div>

      {attachments.length > 0 && (
        <div className={styles.attachmentPreview}>
          <p>{c.selected}</p>
          <ul className={styles.chips}>
            {attachments.map(name => (
              <li className={styles.attachmentChip} key={name}>
                <span className={styles.chipName}>{name}</span>
                <button type="button" onClick={() => setAttachments(previous => previous.filter(file => file !== name))} aria-label={`${c.remove} ${name}`}><X size={16} aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form className={styles.inputBar} onSubmit={handleSend} aria-describedby={`${id}-disclaimer`}>
        <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" className={styles.hiddenFileInput} onChange={handleFileChange} aria-label={c.attach} />
        <button type="button" className={styles.attachButton} onClick={() => fileInputRef.current?.click()} title={c.attach} aria-label={c.attach}><Paperclip size={19} aria-hidden="true" /></button>
        <textarea
          className={`ui-field ${styles.textInput}`}
          placeholder={c.placeholder}
          value={inputValue}
          onChange={event => setInputValue(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) handleSend(event)
          }}
          rows={1}
          aria-label={c.input}
          aria-describedby={`${id}-disclaimer`}
        />
        <button type="submit" className={styles.sendButton} disabled={thinking || (!inputValue.trim() && attachments.length === 0)} aria-label={c.send}><ArrowUp size={20} aria-hidden="true" /></button>
      </form>
      <p className={styles.disclaimer} id={`${id}-disclaimer`}>{c.disclaimer}</p>
    </section>
  )
}
