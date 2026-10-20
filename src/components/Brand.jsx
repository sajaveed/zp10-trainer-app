import logo from '../assets/logo.png'
import styles from './Brand.module.css'

export default function Brand({ compact = false }) {
  return (
    <span className={styles.brand}>
      <img src={logo} alt="" width="36" height="36" className={styles.mark} />
      {!compact && <span className={styles.name}>ZP10 <span>Trainer</span></span>}
    </span>
  )
}
