import { useTranslation } from 'react-i18next'
import { pages } from '../lib/constants'

export function Header({ currentPath, onNavigate, apiStatus }) {
  const { t, i18n } = useTranslation()

  function toggleLang() {
    const next = i18n.language === 'sk' ? 'en' : 'sk'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => onNavigate('/')}>
        <span className="brand-mark">W2</span>
        <span>
          <strong>WEBTE2 SimLab</strong>
          <small>{t('header.subtitle')}</small>
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
            {t(page.labelKey)}
          </button>
        ))}
      </nav>

      <div className="header-end">
        <button type="button" className="lang-toggle" onClick={toggleLang}>
          {i18n.language === 'sk' ? 'EN' : 'SK'}
        </button>
        <span className={`status-pill ${apiStatus}`}>{apiStatus}</span>
      </div>
    </header>
  )
}
