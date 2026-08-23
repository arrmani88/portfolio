import { Outlet } from 'react-router-dom'
// import DotBackground from '../components/DotBackground'
import ShaderBackground from '../components/ShaderBackground'
// import ThemeToggle from '../components/ThemeToggle'

const Layout = () => {
  return (
    <>
      <ShaderBackground />
      <Outlet />
    </>
  )
}

export default Layout
