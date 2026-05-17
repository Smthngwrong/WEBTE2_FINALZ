import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { useRoute } from './hooks/useRoute'
import { apiRequest, ensureLocalIdentity } from './lib/api'
import { pages } from './lib/constants'
import { DocsPage } from './pages/DocsPage'
import { LogsPage } from './pages/LogsPage'
import { Home } from './pages/Home'
import { SimulationPage } from './pages/SimulationPage'
import { StatsPage } from './pages/StatsPage'
import { TerminalPage } from './pages/TerminalPage'
import './App.css'

function App() {
  const [path, navigate] = useRoute()
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    ensureLocalIdentity()
    apiRequest('/ping')
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  const page = pages.some((item) => item.path === path) ? path : '/'

  return (
    <div className="app-shell">
      <Header currentPath={page} onNavigate={navigate} apiStatus={apiStatus} />
      <main>
        {page === '/' && <Home onNavigate={navigate} />}
        {page === '/terminal' && <TerminalPage />}
        {page === '/simulate/pendulum' && <SimulationPage type="pendulum" />}
        {page === '/simulate/ballbeam' && <SimulationPage type="ballbeam" />}
        {page === '/stats' && <StatsPage />}
        {page === '/docs' && <DocsPage />}
        {page === '/logs' && <LogsPage />}
      </main>
    </div>
  )
}

export default App
