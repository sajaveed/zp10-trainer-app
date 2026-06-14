import { useLang } from '../hooks/useLang'
import logo from '../assets/logo.png'
import styles from './Footer.module.css'

export default function Footer() {
  const { t } = useLang()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <a href="#home" className={styles.brand}>
            <img src={logo} alt="ZP10 Trainer" className={styles.logo} />
            <span className={styles.brandText}>ZP10<span>Trainer</span></span>
          </a>
          <p className={styles.tagline}>{t.footer.tagline}</p>
        </div>
        <div className={styles.links}>
          <div className={styles.col}>
            <h5>{t.footer.appCol}</h5>
            <a href="#how">{t.nav.how}</a>
            <a href="#subjects">{t.nav.subjects}</a>
            <a href="#ki">Levi</a>
          </div>
          <div className={styles.col}>
            <h5>{t.footer.legalCol}</h5>
            <a href="#">{t.footer.privacy}</a>
            <a href="#">{t.footer.imprint}</a>
            <a href="#">{t.footer.terms}</a>
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
