import { useLang } from '../hooks/useLang'
import styles from './Zeno.module.css'

export default function Zeno() {
  const { t } = useLang()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>{t.zenoPage.kicker}</p>
        <h1 className={styles.title}>{t.zenoPage.title}</h1>
        <p className={styles.subtitle}>{t.zenoPage.redesignHint}</p>
      </header>
      <section className={styles.placeholder}>{t.zenoPage.redesignPlaceholder}</section>
    </div>
  )
}
