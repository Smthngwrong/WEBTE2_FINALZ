import { useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { PageTitle } from '../components/PageTitle'
import { authHeaders, apiRequest } from '../lib/api'
import { API_BASE_URL, API_TOKEN, TOKEN_KEY } from '../lib/constants'

export function DocsPage() {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

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
        title="API Dokumentacia"
        text="REST API dokumentacia podla standardu OpenAPI 3.0."
      />
      <div className="docs-actions">
        <button type="button" onClick={downloadPdf} disabled={downloading}>
          {downloading ? 'Stahujem...' : 'Stiahnut PDF'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="swagger-wrapper">
        <SwaggerUI
          url={`${API_BASE_URL}/openapi.yaml`}
          docExpansion="full"
          defaultModelsExpandDepth={2}
          requestInterceptor={(req) => {
            req.headers['Authorization'] = `Bearer ${localStorage.getItem(TOKEN_KEY) ?? API_TOKEN}`
            return req
          }}
        />
      </div>
    </section>
  )
}
