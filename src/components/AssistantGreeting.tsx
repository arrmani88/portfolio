import { useTranslation } from 'react-i18next'
import styles from './AssistantGreeting.module.css'

const AssistantGreeting = () => {
  const { t } = useTranslation()

  return <h1 className={styles.greeting}>{t('home.assistantGreeting')}</h1>
}

export default AssistantGreeting
