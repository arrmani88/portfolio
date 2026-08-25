import { useTranslation } from 'react-i18next'
import LightWavesOverlay from '../components/LightWavesOverlay'

const Home = () => {
  const { t } = useTranslation()

  return (
    <main>
      <LightWavesOverlay />
      <h1>{t('home.title')}</h1>
    </main>
  )
}

export default Home
