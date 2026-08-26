import BackgroundScene from '../components/BackgroundScene'
import AssistantGreeting from '../components/AssistantGreeting'
import CyberButton from '../components/CyberButton'
import BootOverlay from '../components/intro/BootOverlay'
import { SCENE_FADE_IN_DELAY_S, GREETING_REVEAL_DELAY_S } from '../components/intro/introTiming'

const Home = () => {
  return (
    <main>
      <BootOverlay />
      <BackgroundScene fadeIn fadeInDelay={`${SCENE_FADE_IN_DELAY_S}s`} />
      <AssistantGreeting revealDelay={`${GREETING_REVEAL_DELAY_S}s`} />
      <CyberButton />
    </main>
  )
}

export default Home
