import { useLang } from '../hooks/useLang'
import Brand from './Brand'
import styles from './Footer.module.css'

export default function Footer() {
  const { t, lang } = useLang()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <a href="/#home" className={styles.brand} aria-label="ZP10 Trainer">
            <Brand />
          </a>
          <p className={styles.tagline}>{t.footer.tagline}</p>
        </div>
        <div className={styles.links}>
          <div className={styles.col}>
            <h2>{t.footer.appCol}</h2>
            <a href="/#how">{t.nav.how}</a>
            <a href="/#subjects">{t.nav.subjects}</a>
            <a href="/#ki">Zeno</a>
          </div>
          <div className={styles.col}>
            <h2>{t.footer.legalCol}</h2>
            <span>{t.footer.privacy}</span>
            <span>{t.footer.imprint}</span>
            <span>{t.footer.terms}</span>
            <p className={styles.legalHint}>{lang === 'de' ? 'Rechtliche Informationen werden noch ergänzt.' : 'Legal information is not yet available.'}</p>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>{t.footer.copy}</p>
        <p>{t.footer.disclaimer}</p>
      </div>
    </footer>
  )
}
