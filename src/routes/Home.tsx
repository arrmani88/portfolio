import { useTranslation } from 'react-i18next'
import BackgroundScene from '../components/BackgroundScene'

const Home = () => {
  const { t } = useTranslation()

  return (
    <main>
      <BackgroundScene />
      <h1>{t('home.title')}</h1>
    </main>
  )
}

export default Home
