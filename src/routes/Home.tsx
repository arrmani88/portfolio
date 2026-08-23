import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <main>
      <h1>Home</h1>
      <Link to="/about">Go to About</Link>
    </main>
  )
}

export default Home
