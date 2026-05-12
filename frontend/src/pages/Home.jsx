function FeatureCard({ title, text, onClick }) {
  return (
    <button className="feature-card" type="button" onClick={onClick}>
      <span>{title}</span>
      <p>{text}</p>
    </button>
  )
}

export function Home({ onNavigate }) {
  return (
    <section className="page-grid">
      <div className="intro-panel">
        <p className="eyebrow">Frontend cast zadania</p>
        <h1>Webove rozhranie pre Octave simulacie</h1>
        <p>
          Jedna aplikacia pre CAS terminal, spustanie fyzikalnych modelov,
          synchronizovanu animaciu, grafy, statistiky a PDF dokumentaciu.
        </p>
        <div className="quick-actions">
          <button type="button" onClick={() => onNavigate('/simulate/pendulum')}>
            Spustit kyvadlo
          </button>
          <button type="button" onClick={() => onNavigate('/terminal')}>
            Otvorit terminal
          </button>
        </div>
      </div>

      <div className="feature-list">
        <FeatureCard
          title="Inverted pendulum"
          text="Parametre, request na API, canvas animacia a casovy graf uhla aj polohy."
          onClick={() => onNavigate('/simulate/pendulum')}
        />
        <FeatureCard
          title="Ball on beam"
          text="Samostatna vizualizacia gulicky, uhla nosnika a kontinuacny beh z final_state."
          onClick={() => onNavigate('/simulate/ballbeam')}
        />
        <FeatureCard
          title="Octave terminal"
          text="Perzistentna session, prikazy, vystupy stdout/stderr a ukoncenie session."
          onClick={() => onNavigate('/terminal')}
        />
        <FeatureCard
          title="Monitoring"
          text="Statistiky pouzivania a dokumentacia API pripravena na stiahnutie ako PDF."
          onClick={() => onNavigate('/stats')}
        />
      </div>
    </section>
  )
}
