import { useState } from 'react'
import BackgroundScene from '../components/BackgroundScene'
import AssistantGreeting from '../components/AssistantGreeting'
import CyberButton from '../components/CyberButton'
import BootOverlay from '../components/intro/BootOverlay'
import {
  SCENE_FADE_IN_DELAY_S,
  GREETING_REVEAL_DELAY_AFTER_CONVERGE_S,
  CTA_REVEAL_DELAY_AFTER_CONVERGE_S,
} from '../components/intro/introTiming'
import styles from './Home.module.css'

const Home = () => {
  // TEMP: landing animation, remove when no longer wanted. The greeting/CTA don't
  // mount until the sphere actually signals it has converged (see BackgroundScene's
  // onSphereConverged), instead of guessing the right absolute delay on a separate
  // clock that can drift out of sync with the sphere's own render-loop timing.
  const [sphereConverged, setSphereConverged] = useState(false)

  return (
    <main>
      <BootOverlay />
      <BackgroundScene
        fadeIn
        fadeInDelay={`${SCENE_FADE_IN_DELAY_S}s`}
        onSphereConverged={() => setSphereConverged(true)}
      />
      {sphereConverged && (
        <div className={styles.calloutStack}>
          <AssistantGreeting revealDelay={`${GREETING_REVEAL_DELAY_AFTER_CONVERGE_S}s`} />
          <CyberButton revealDelay={`${CTA_REVEAL_DELAY_AFTER_CONVERGE_S}s`} />
        </div>
      )}
    </main>
  )
}

export default Home
