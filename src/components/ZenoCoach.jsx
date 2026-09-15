import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../hooks/useLang'
import styles from './ZenoCoach.module.css'

// ─── Mock data ────────────────────────────────────────────────────────────────
// Replace `mockMessages` with real API responses once the AI model is ready.
// The shape { role: 'zeno'|'student', text: string, timestamp: Date } is
// intentionally kept simple so a future useSendMessage() hook can produce the
// same structure from a backend response.
function buildInitialMessages(t) {
  return [
    {
      id: 1,
      role: 'zeno',
      text: t.zenoCoach.initialMessageA,
      timestamp: new Date(Date.now() - 90_000),
    },
    {
      id: 2,
      role: 'student',
      text: t.zenoCoach.initialMessageB,
      timestamp: new Date(Date.now() - 60_000),
    },
    {
      id: 3,
      role: 'zeno',
      text: t.zenoCoach.initialMessageC,
      timestamp: new Date(Date.now() - 30_000),
    },
  ]
}

// ─── Helper: format HH:MM ─────────────────────────────────────────────────────
function fmtTime(date) {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isZeno = message.role === 'zeno'
  return (
    <div className={`${styles.messageRow} ${isZeno ? styles.zenoRow : styles.studentRow}`}>
      {isZeno && (
        <div className={styles.bubbleAvatar} aria-hidden="true">Z</div>
      )}
      <div className={`${styles.bubble} ${isZeno ? styles.zenoBubble : styles.studentBubble}`}>
        <p className={styles.bubbleText}>{message.text}</p>
        <time className={styles.bubbleTime} dateTime={message.timestamp.toISOString()}>
          {fmtTime(message.timestamp)}
        </time>
      </div>
    </div>
  )
}

function TypingIndicator({ t }) {
  return (
    <div className={`${styles.messageRow} ${styles.zenoRow}`}>
      <div className={styles.bubbleAvatar} aria-hidden="true">Z</div>
      <div className={`${styles.bubble} ${styles.zenoBubble} ${styles.typingBubble}`} aria-label={t.zenoCoach.typingAria}>
        <span className={styles.typingDot} />
        <span className={styles.typingDot} />
        <span className={styles.typingDot} />
      </div>
    </div>
  )
}

function AttachmentChip({ file, onRemove }) {
  const isImage = file.type.startsWith('image/')
  const icon = isImage ? '🖼️' : '📎'
  return (
    <span className={styles.attachmentChip}>
      <span className={styles.chipIcon}>{icon}</span>
      <span className={styles.chipName}>{file.name}</span>
      <button
        type="button"
        className={styles.chipRemove}
        onClick={() => onRemove(file.name)}
        aria-label={`${file.name} entfernen`}
      >
        ×
      </button>
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
// Structure is intentionally split so a future hook (e.g. useZenoChat) can
// replace `messages`, `thinking`, and `handleSend` with API-backed equivalents.

export default function ZenoCoach({ popup = false }) {
  const { t } = useLang()
  const [messages, setMessages] = useState(() => buildInitialMessages(t))
  const [inputValue, setInputValue] = useState('')
  const [thinking, setThinking] = useState(false)
  const [attachments, setAttachments] = useState([])
  const fileInputRef = useRef(null)
  const chatWindowRef = useRef(null)

  // Keep scrolling inside the chat area to avoid moving the full page
  useEffect(() => {
    const chatWindow = chatWindowRef.current
    if (!chatWindow) return
    chatWindow.scrollTo({
      top: chatWindow.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, thinking])

  // ── Sending a message (mock – replace body with real API call later) ──────
  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text && attachments.length === 0) return

    const studentMsg = {
      id: Date.now(),
      role: 'student',
      text: text || `[${attachments.map(f => f.name).join(', ')}]`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, studentMsg])
    setInputValue('')
    setAttachments([])
    setThinking(true)

    // TODO: replace the timeout below with a real API call, e.g.:
    // const reply = await fetchZenoReply({ text, attachments, subject, rubric })
    // setMessages(prev => [...prev, { id: ..., role: 'zeno', text: reply.text, timestamp: new Date() }])
    setTimeout(() => {
      setThinking(false)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'zeno',
          text: t.zenoCoach.mockReply,
          timestamp: new Date(),
        },
      ])
    }, 1800)
  }, [attachments, inputValue, t])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => {
      const existing = new Set(prev.map(f => f.name))
      const newFiles = files.filter(f => !existing.has(f.name))
      return [...prev, ...newFiles]
    })
    // Reset input so the same file can be re-selected after removal
    e.target.value = ''
  }, [])

  const removeAttachment = useCallback((name) => {
    setAttachments(prev => prev.filter(f => f.name !== name))
  }, [])

  return (
    <section className={`${styles.wrapper} ${popup ? styles.popupWrapper : ''}`}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.avatarWrap} aria-hidden="true">
          <div className={styles.avatar}>Z</div>
          <div className={styles.statusDot} title={t.zenoCoach.statusOnline} />
        </div>
        <div className={styles.headerInfo}>
          <p className={styles.kicker}>{t.zenoCoach.kicker}</p>
          <h2 className={styles.title}>Zeno</h2>
          <p className={styles.subtitle}>
            {t.zenoCoach.subtitle}
          </p>
        </div>
        <div className={styles.headerBadge}>{t.zenoCoach.inDevelopment}</div>
      </div>

      {/* ── Chat messages ── */}
      <div className={styles.chatWindow} ref={chatWindowRef} role="log" aria-live="polite" aria-label={t.zenoCoach.chatAria}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {thinking && <TypingIndicator t={t} />}
      </div>

      {/* ── Attachment preview ── */}
      {attachments.length > 0 && (
        <div className={styles.attachmentPreview}>
          <span className={styles.attachmentLabel}>{t.zenoCoach.attachmentsLabel}</span>
          <div className={styles.chips}>
            {attachments.map(file => (
              <AttachmentChip key={file.name} file={file} onRemove={removeAttachment} />
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className={styles.inputBar}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          className={styles.hiddenFileInput}
          onChange={handleFileChange}
          aria-label={t.zenoCoach.attachmentsAria}
        />
        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => fileInputRef.current?.click()}
          title={t.zenoCoach.attachmentsButton}
          aria-label={t.zenoCoach.attachmentsButton}
        >
          📎
        </button>
        <textarea
          className={styles.textInput}
          placeholder={t.zenoCoach.inputPlaceholder}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label={t.zenoCoach.inputAria}
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!inputValue.trim() && attachments.length === 0}
          aria-label={t.zenoCoach.sendAria}
        >
          ➤
        </button>
      </div>
      <p className={styles.disclaimer}>
        {t.zenoCoach.disclaimer}
      </p>
    </section>
  )
}
