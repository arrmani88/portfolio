import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './CyberButton.module.css'
import ChevronIcon from './icons/ChevronIcon'

type CyberButtonProps = {
  revealDelay?: string
}

const CyberButton = ({ revealDelay }: CyberButtonProps) => {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      className={styles.button}
      style={revealDelay ? ({ '--cta-reveal-delay': revealDelay } as CSSProperties) : undefined}
    >
      {t('home.cta')}
      <ChevronIcon className={styles.chevron} />
    </button>
  )
}

export default CyberButton
