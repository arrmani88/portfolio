import { Outlet } from 'react-router-dom'
// import DotBackground from '../components/DotBackground'
// import SpaceStarsBackground from '../components/SpaceStarsBackground'
// import FloatingLightsBackground from '../components/FloatingLightsBackground'
// import LanguageSwitcher from '../components/LanguageSwitcher'

const Layout = () => {
  return (
    <>
      {/* <SpaceStarsBackground /> */}
      {/* <FloatingLightsBackground /> */}
      {/* <LanguageSwitcher /> */}
      <Outlet />
    </>
  )
}

export default Layout

