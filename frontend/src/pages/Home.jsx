import { useTranslation } from 'react-i18next'

function FeatureCard({ title, text, onClick }) {
  return (
    <button className="feature-card" type="button" onClick={onClick}>
      <span>{title}</span>
      <p>{text}</p>
    </button>
  )
}

export function Home({ onNavigate }) {
  const { t } = useTranslation()

  return (
    <section className="page-grid">
      <div className="intro-panel">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1>{t('home.title')}</h1>
        <p>{t('home.text')}</p>
        <div className="quick-actions">
          <button type="button" onClick={() => onNavigate('/simulate/pendulum')}>
            {t('home.btn_pendulum')}
          </button>
          <button type="button" onClick={() => onNavigate('/terminal')}>
            {t('home.btn_terminal')}
          </button>
        </div>
      </div>

      <div className="feature-list">
        <FeatureCard
          title={t('home.card1_title')}
          text={t('home.card1_text')}
          onClick={() => onNavigate('/simulate/pendulum')}
        />
        <FeatureCard
          title={t('home.card2_title')}
          text={t('home.card2_text')}
          onClick={() => onNavigate('/simulate/ballbeam')}
        />
        <FeatureCard
          title={t('home.card3_title')}
          text={t('home.card3_text')}
          onClick={() => onNavigate('/terminal')}
        />
        <FeatureCard
          title={t('home.card4_title')}
          text={t('home.card4_text')}
          onClick={() => onNavigate('/stats')}
        />
      </div>
    </section>
  )
}
