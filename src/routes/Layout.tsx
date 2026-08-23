import { Outlet } from 'react-router-dom'
import DotBackground from '../components/DotBackground'
import ThemeToggle from '../components/ThemeToggle'

const Layout = () => {
  return (
    <>
      <DotBackground />
      <ThemeToggle />
      <Outlet />
    </>
  )
}

export default Layout
