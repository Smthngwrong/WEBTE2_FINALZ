import { pages } from '../lib/constants'

export function Header({ currentPath, onNavigate, apiStatus }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => onNavigate('/')}>
        <span className="brand-mark">W2</span>
        <span>
          <strong>WEBTE2 SimLab</strong>
          <small>Octave REST frontend</small>
        </span>
      </button>

      <nav aria-label="Hlavna navigacia">
        {pages.map((page) => (
          <button
            className={currentPath === page.path ? 'active' : ''}
            key={page.path}
            type="button"
            onClick={() => onNavigate(page.path)}
          >
            {page.label}
          </button>
        ))}
      </nav>

      <span className={`status-pill ${apiStatus}`}>{apiStatus}</span>
    </header>
  )
}
