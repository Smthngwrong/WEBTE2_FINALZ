import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { octave } from '../lib/octaveLang'
import { PageTitle } from '../components/PageTitle'
import { apiRequest } from '../lib/api'
import { examples } from '../lib/constants'

export function TerminalPage() {
  const [sessionId, setSessionId] = useState('')
  const [command, setCommand] = useState('a = 1 + 1')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function createSession() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/session/create', { method: 'POST' })
      setSessionId(data.sessionId)
      setEntries([{ command: 'session created', stdout: data.sessionId, success: true }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiRequest('/session/create', { method: 'POST' })
      .then((data) => {
        if (cancelled) return
        setSessionId(data.sessionId)
        setEntries([{ command: 'session created', stdout: data.sessionId, success: true }])
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

  async function destroySession() {
    if (!sessionId) return
    setLoading(true)
    try {
      await apiRequest(`/session/${sessionId}`, { method: 'DELETE' })
      setSessionId('')
      setEntries((current) => [
        ...current,
        { command: 'session destroyed', stdout: 'ok', success: true },
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function executeCommand(event) {
    event.preventDefault()
    if (!command.trim() || !sessionId) return

    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/execute', {
        method: 'POST',
        body: JSON.stringify({ sessionId, command }),
      })
      setEntries((current) => [...current, { command, ...data }])
      setCommand('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="workspace">
      <PageTitle
        eyebrow="CAS terminal"
        title="Perzistentna Octave session"
        text="Premenne ostavaju v session medzi requestami, takze mozes skladat vypocty postupne."
      />

      <div className="terminal-layout">
        <form className="control-panel" onSubmit={executeCommand}>
          <label>
            Session ID
            <input readOnly value={sessionId || 'nevytvorena'} />
          </label>
          <label as="span">
            Octave prikaz
            <CodeMirror
              value={command}
              height="120px"
              extensions={[octave]}
              onChange={(value) => setCommand(value)}
              className="cm-terminal"
            />
          </label>
          <div className="button-row">
            <button disabled={loading || !sessionId} type="submit">
              Spustit
            </button>
            <button disabled={loading} type="button" onClick={createSession}>
              Nova session
            </button>
            <button disabled={loading || !sessionId} type="button" onClick={destroySession}>
              Zrusit
            </button>
          </div>
          <div className="example-row">
            {examples.map((item) => (
              <button key={item} type="button" onClick={() => setCommand(item)}>
                {item}
              </button>
            ))}
          </div>
          {error && <p className="error-text">{error}</p>}
        </form>

        <div className="terminal-output" aria-live="polite">
          {entries.length === 0 && <p className="muted">Zatial nie je ziadny vystup.</p>}
          {entries.map((entry, index) => (
            <article key={`${entry.command}-${index}`}>
              <strong>&gt; {entry.command}</strong>
              {entry.stdout && <pre>{entry.stdout}</pre>}
              {entry.stderr && <pre className="stderr">{entry.stderr}</pre>}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
