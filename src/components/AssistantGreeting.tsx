import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './AssistantGreeting.module.css'

type AssistantGreetingProps = {
  revealDelay?: string
}

const AssistantGreeting = ({ revealDelay }: AssistantGreetingProps) => {
  const { t } = useTranslation()
  const text = t('home.assistantGreeting')

  return (
    <h1
      className={styles.greeting}
      data-text={text}
      style={revealDelay ? ({ '--reveal-delay': revealDelay } as CSSProperties) : undefined}
    >
      {text}
    </h1>
  )
}

export default AssistantGreeting
