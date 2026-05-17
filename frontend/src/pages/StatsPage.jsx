import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '../components/PageTitle'
import { apiRequest } from '../lib/api'

export function StatsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadStats() {
    setLoading(true)
    setError('')
    apiRequest('/stats')
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    apiRequest('/stats')
      .then((data) => { if (!cancelled) setStats(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="workspace">
      <PageTitle
        eyebrow={t('stats.eyebrow')}
        title={t('stats.title')}
        text={t('stats.text')}
      />
      <div className="stats-grid">
        <StatBlock title={t('stats.executions')} data={stats?.executions} loading={loading} />
        <StatBlock title={t('stats.pendulum_anim')} data={stats?.animations?.pendulum} loading={loading} animation="pendulum" />
        <StatBlock title={t('stats.ballbeam_anim')} data={stats?.animations?.ballbeam} loading={loading} animation="ballbeam" />
      </div>
      <button type="button" onClick={loadStats} disabled={loading}>
        {t('stats.btn_refresh')}
      </button>
      {error && <p className="error-text">{error}</p>}
    </section>
  )
}

function StatBlock({ title, data, loading, animation }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const countries = Object.entries(data?.by_country ?? {})

  function toggle() {
    if (!expanded && details === null) {
      setDetailsLoading(true)
      apiRequest(`/stats/details?animation=${animation}&per_page=100`)
        .then((res) => setDetails(res.data))
        .catch(() => setDetails([]))
        .finally(() => setDetailsLoading(false))
    }
    setExpanded((v) => !v)
  }

  return (
    <article className="stat-block">
      <span>{title}</span>
      <strong>{loading ? '...' : data?.total ?? 0}</strong>
      <div>
        {countries.length === 0 ? (
          <p className="muted">{t('stats.no_countries')}</p>
        ) : (
          countries.map(([country, value]) => (
            <p key={country}>{country}: {value}</p>
          ))
        )}
      </div>
      {animation && (
        <button type="button" onClick={toggle} disabled={loading}>
          {expanded ? t('stats.btn_hide') : t('stats.btn_show')}
        </button>
      )}
      {expanded && (
        <div className="stat-details">
          {detailsLoading && <p className="muted">{t('stats.loading')}</p>}
          {!detailsLoading && details?.length === 0 && (
            <p className="muted">{t('stats.no_records')}</p>
          )}
          {!detailsLoading && details?.length > 0 && (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>{t('stats.th_datetime')}</th>
                  <th>{t('stats.th_city')}</th>
                  <th>{t('stats.th_country')}</th>
                </tr>
              </thead>
              <tbody>
                {details.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.used_at).toLocaleString()}</td>
                    <td>{row.city ?? '—'}</td>
                    <td>{row.country ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </article>
  )
}
