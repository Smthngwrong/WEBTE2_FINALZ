import { useState } from 'react'
import { PageTitle } from '../components/PageTitle'
import { authHeaders } from '../lib/api'
import { API_BASE_URL, apiDocs } from '../lib/constants'

export function DocsPage() {
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  async function downloadPdf() {
    setDownloading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/docs/pdf`, {
        headers: authHeaders(false),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? `Request failed with status ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'webte2-api-docs.pdf'
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
        eyebrow="Dokumentacia"
        title="API kontrakt pre frontend"
        text="Frontend pouziva API token v Authorization hlavicke a anonymny X-User-Token pri statistikach."
      />

      <div className="docs-actions">
        <button type="button" onClick={downloadPdf} disabled={downloading}>
          {downloading ? 'Stahujem...' : 'Stiahnut PDF'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}

      <div className="endpoint-table">
        {apiDocs.map(([method, endpoint, description]) => (
          <article key={endpoint}>
            <span className={`method ${method.toLowerCase()}`}>{method}</span>
            <code>{endpoint}</code>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
