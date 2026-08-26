import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './CyberButton.module.css'
import { CTA_REVEAL_DELAY_S } from './intro/introTiming'
import ChevronIcon from './icons/ChevronIcon'

const CyberButton = () => {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      className={styles.button}
      style={{ '--cta-reveal-delay': `${CTA_REVEAL_DELAY_S}s` } as CSSProperties}
    >
      {t('home.cta')}
      <ChevronIcon className={styles.chevron} />
    </button>
  )
}

export default CyberButton
