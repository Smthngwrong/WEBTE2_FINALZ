import { useEffect, useState } from 'react'
import { PageTitle } from '../components/PageTitle'
import { apiRequest } from '../lib/api'

export function StatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadStats() {
    setLoading(true)
    setError('')
    try {
      setStats(await apiRequest('/stats'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiRequest('/stats')
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="workspace">
      <PageTitle
        eyebrow="Statistiky"
        title="Pouzivanie API a animacii"
        text="Prehlad requestov a prehrati animacii podla odpovede backendu."
      />
      <div className="stats-grid">
        <StatBlock title="Executions" data={stats?.executions} loading={loading} />
        <StatBlock title="Pendulum animations" data={stats?.animations?.pendulum} loading={loading} />
        <StatBlock title="Ball-beam animations" data={stats?.animations?.ballbeam} loading={loading} />
      </div>
      <button type="button" onClick={loadStats} disabled={loading}>
        Obnovit statistiky
      </button>
      {error && <p className="error-text">{error}</p>}
    </section>
  )
}

function StatBlock({ title, data, loading }) {
  const countries = Object.entries(data?.by_country ?? {})

  return (
    <article className="stat-block">
      <span>{title}</span>
      <strong>{loading ? '...' : data?.total ?? 0}</strong>
      <div>
        {countries.length === 0 ? (
          <p className="muted">Bez krajin.</p>
        ) : (
          countries.map(([country, value]) => (
            <p key={country}>
              {country}: {value}
            </p>
          ))
        )}
      </div>
    </article>
  )
}
