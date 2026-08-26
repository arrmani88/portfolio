import { useTranslation } from 'react-i18next'
import BackgroundScene from '../components/BackgroundScene'
import AssistantGreeting from '../components/AssistantGreeting'

const Home = () => {
  const { t } = useTranslation()

  return (
    <main>
      <BackgroundScene />
      <AssistantGreeting />
      <h2>{t('home.title')}</h2>
    </main>
  )
}

export default Home
