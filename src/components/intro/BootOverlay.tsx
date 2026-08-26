import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './BootOverlay.module.css'
import { BOOT_FADE_DELAY_S, BOOT_FADE_DURATION_S } from './introTiming'

type BootOverlayProps = {
  onDone?: () => void
}

const BootOverlay = ({ onDone }: BootOverlayProps) => {
  const { t } = useTranslation()
  const [done, setDone] = useState(false)

  if (done) return null

  return (
    <div
      className={styles.overlay}
      aria-hidden="true"
      style={
        {
          '--boot-fade-delay': `${BOOT_FADE_DELAY_S}s`,
          '--boot-fade-duration': `${BOOT_FADE_DURATION_S}s`,
        } as CSSProperties
      }
      onAnimationEnd={(e) => {
        // Only the overlay's own fade-out (not the child bracket/scanline animations)
        // should trigger unmount
        if (e.target === e.currentTarget) {
          setDone(true)
          onDone?.()
        }
      }}
    >
      <div className={styles.frame}>
        <span className={styles.bracket} data-corner="tl" />
        <span className={styles.bracket} data-corner="tr" />
        <span className={styles.bracket} data-corner="bl" />
        <span className={styles.bracket} data-corner="br" />
        <div className={styles.scanline} />
        <p className={styles.status}>{t('boot.initializing')}</p>
      </div>
    </div>
  )
}

export default BootOverlay
