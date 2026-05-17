import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '../components/PageTitle'
import { authHeaders } from '../lib/api'
import { API_BASE_URL } from '../lib/constants'

export function LogsPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/logs?page=${page}&per_page=50`, {
      headers: authHeaders(false),
    })
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return
        setLogs(res.data)
        setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total })
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [page])

  async function downloadCsv() {
    setDownloading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/logs/export`, {
        headers: authHeaders(false),
      })
      if (!response.ok) throw new Error(`Status ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'logs.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="workspace">
      <PageTitle
        eyebrow={t('logs.eyebrow')}
        title={t('logs.title')}
        text={t('logs.text')}
      />

      <div className="button-row">
        <button type="button" onClick={downloadCsv} disabled={downloading || loading}>
          {downloading ? t('logs.btn_exporting') : t('logs.btn_export')}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="logs-table-wrapper">
        {loading ? (
          <p className="muted" style={{ padding: '16px' }}>{t('logs.loading')}</p>
        ) : logs.length === 0 ? (
          <p className="muted" style={{ padding: '16px' }}>{t('logs.no_records')}</p>
        ) : (
          <table className="detail-table">
            <thead>
              <tr>
                <th>{t('logs.th_id')}</th>
                <th>{t('logs.th_datetime')}</th>
                <th>{t('logs.th_type')}</th>
                <th>{t('logs.th_command')}</th>
                <th>{t('logs.th_status')}</th>
                <th>{t('logs.th_error')}</th>
                <th>{t('logs.th_city')}</th>
                <th>{t('logs.th_country')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td><code>{row.type}</code></td>
                  <td className="log-cmd" title={row.command ?? row.params ?? ''}>
                    {row.command
                      ? row.command.slice(0, 60) + (row.command.length > 60 ? '…' : '')
                      : row.params
                        ? row.params.slice(0, 60) + (row.params.length > 60 ? '…' : '')
                        : '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${row.status}`}>{row.status}</span>
                  </td>
                  <td className="log-error" title={row.error ?? ''}>
                    {row.error ? row.error.slice(0, 40) + (row.error.length > 40 ? '…' : '') : '—'}
                  </td>
                  <td>{row.city ?? '—'}</td>
                  <td>{row.country ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && (
        <div className="pagination-row">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
            {t('logs.btn_prev')}
          </button>
          <span className="muted">
            {t('logs.pagination', { current: meta.current_page, last: meta.last_page, total: meta.total })}
          </span>
          <button type="button" disabled={page >= meta.last_page || loading} onClick={() => setPage((p) => p + 1)}>
            {t('logs.btn_next')}
          </button>
        </div>
      )}
    </section>
  )
}
