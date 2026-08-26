import { useTranslation } from 'react-i18next'
import styles from './AssistantGreeting.module.css'

const AssistantGreeting = () => {
  const { t } = useTranslation()
  const text = t('home.assistantGreeting')

  // data-text mirrors the visible text so the smoke-reveal pseudo-elements (which
  // can only pull content from an attribute, not the element's real text node) show
  // the same copy during the animation.
  return (
    <h1 className={styles.greeting} data-text={text}>
      {text}
    </h1>
  )
}

export default AssistantGreeting
