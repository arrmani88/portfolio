import { createBrowserRouter } from 'react-router-dom'
import Layout from './routes/Layout'
import Home from './routes/Home'
import About from './routes/About'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
    ],
  },
])
