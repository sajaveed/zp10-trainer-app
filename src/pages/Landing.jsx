import { useEffect, useRef, useState } from 'react'
import { useLang } from '../hooks/useLang'
import styles from './Landing.module.css'

function SectionLabel({ children }) {
  return <div className={styles.label}>{children}</div>
}

function HeroDemo({ t }) {
  const barRef = useRef(null)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = '85%'
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={styles.demoCard}>
      <div className={styles.demoHeader}>
        <div>
          <div className={styles.demoTask}>{t.hero.demoTask}</div>
          <div className={styles.demoStatus}>{t.hero.demoStatus}</div>
        </div>
        <div className={styles.demoPts}>17<span> / 20 Pkt.</span></div>
      </div>
      <div className={styles.demoBarWrap}>
        <div className={styles.demoBarFill} ref={barRef} />
      </div>
      <div className={styles.demoTags}>
        <span className={`${styles.tag} ${styles.tagGood}`}>{t.hero.demoTagThesis}</span>
        <span className={`${styles.tag} ${styles.tagGood}`}>{t.hero.demoTagEvidence}</span>
        <span className={`${styles.tag} ${styles.tagWarn}`}>{t.hero.demoTagCounter}</span>
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  const answerRef = useRef(null)

  return (
    <div className={`${styles.faqItem} ${open ? styles.faqOpen : ''}`}>
      <button className={styles.faqQ} onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <div className={styles.faqIcon}>{open ? '−' : '+'}</div>
      </button>
      <div
        className={styles.faqA}
        style={{ maxHeight: open ? answerRef.current?.scrollHeight + 'px' : '0' }}
      >
        <div className={styles.faqAInner} ref={answerRef}>{a}</div>
      </div>
    </div>
  )
}

export default function Landing({ onAuthClick }) {
  const { t } = useLang()

  const subjects = [
    {
      emoji: '📖', name: 'Deutsch', sub: t.subjects.deSub,
      tags: ['Analyse', 'Argumentation', 'Stellungnahme', 'Zusammenfassung', 'Sprache'],
    },
    {
      emoji: '🔢', name: 'Mathematik', sub: t.subjects.mathSub,
      tags: ['Funktionen', 'Geometrie', 'Wahrscheinlichkeit', 'Algebra', 'Sachaufgaben'],
    },
    {
      emoji: '🌍', name: 'Englisch', sub: t.subjects.enSub,
      tags: ['Reading', 'Listening', 'Comment', 'Mediation', 'Vocabulary', 'Grammar'],
    },
  ]

  const faqItems = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
  ]

  return (
    <main>
      {/* ── HERO ── */}
      <section className={styles.hero} id="home">
        <h1 className={styles.heroH1}>
          {t.hero.h1a}<br /><em>{t.hero.h1b}</em>
        </h1>
        <p className={styles.heroSub}>{t.hero.sub}</p>
        <div className={styles.heroCta}>
          <button className={styles.btnPrimary} onClick={onAuthClick}>{t.hero.cta}</button>
          <a className={styles.btnSecondary} href="#how">{t.hero.learnMore}</a>
        </div>
        <HeroDemo t={t} />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.section} id="how">
        <div className={styles.inner}>
          <SectionLabel>{t.how.label}</SectionLabel>
          <h2 className={styles.sectionTitle}>{t.how.title}</h2>
          <p className={styles.sectionSub}>{t.how.sub}</p>
          <div className={styles.stepsGrid}>
            {[
              { num: '01', icon: '📝', title: t.how.s1title, text: t.how.s1text },
              { num: '02', icon: '🤖', title: t.how.s2title, text: t.how.s2text },
              { num: '03', icon: '📈', title: t.how.s3title, text: t.how.s3text },
            ].map(s => (
              <div className={styles.step} key={s.num}>
                <div className={styles.stepNum}>{s.num}</div>
                <div className={styles.stepIcon}>{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <section className={styles.section} id="subjects">
        <div className={styles.inner}>
          <SectionLabel>{t.subjects.label}</SectionLabel>
          <h2 className={styles.sectionTitle}>{t.subjects.title}</h2>
          <p className={styles.sectionSub}>{t.subjects.sub}</p>
          <div className={styles.subjectsGrid}>
            {subjects.map(s => (
              <div className={styles.subjectCard} key={s.name}>
                <span className={styles.subjectEmoji}>{s.emoji}</span>
                <h3>{s.name}</h3>
                <p>{s.sub}</p>
                <div className={styles.moduleTags}>
                  {s.tags.map(tag => <span className={styles.moduleTag} key={tag}>{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KI FEEDBACK ── */}
      <section className={styles.kiSection} id="ki">
        <div className={styles.inner}>
          <div className={styles.kiGrid}>
            <div>
              <SectionLabel>{t.ki.label}</SectionLabel>
              <h2 className={styles.sectionTitle}>{t.ki.title}</h2>
              <p className={styles.sectionSub}>{t.ki.sub}</p>
              <div className={styles.kiFeatures}>
                {[
                  { title: t.ki.f1title, text: t.ki.f1text },
                  { title: t.ki.f2title, text: t.ki.f2text },
                  { title: t.ki.f3title, text: t.ki.f3text },
                ].map(f => (
                  <div className={styles.kiFeature} key={f.title}>
                    <div className={styles.kiDot} />
                    <div>
                      <h4>{f.title}</h4>
                      <p>{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.kiMockup}>
              <div className={styles.kiMsg}>
                <div className={`${styles.kiAvatar} ${styles.student}`}>S</div>
                <div className={styles.kiBubble}>{t.ki.mockContent}</div>
              </div>
              <div className={styles.kiMsg}>
                <div className={`${styles.kiAvatar} ${styles.ai}`}>Levi</div>
                <div className={`${styles.kiBubble} ${styles.kiBubbleAi}`}>
                  <div className={styles.kiScoreLine}>
                    <span>{t.ki.mockLabel1}</span><span className={styles.kiScore}>8 / 10</span>
                  </div>
                  <div className={styles.kiMiniBar}><div className={styles.kiMiniFill} style={{ width: '80%' }} /></div>
                  <div className={styles.kiScoreLine}>
                    <span>{t.ki.mockLabel2}</span><span className={styles.kiScore}>7 / 10</span>
                  </div>
                  <div className={styles.kiMiniBar}><div className={styles.kiMiniFill} style={{ width: '70%' }} /></div>
                  <div className={styles.kiFeedback}>
                    {t.ki.mockFeedback.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.section} id="faq">
        <div className={styles.inner}>
          <SectionLabel>FAQ</SectionLabel>
          <h2 className={styles.sectionTitle}>{t.faq.title}</h2>
          <div className={styles.faqList}>
            {faqItems.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>
    </main>
  )
}
