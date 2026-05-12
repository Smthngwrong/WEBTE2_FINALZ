import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasScene } from '../components/CanvasScene'
import { MetricList } from '../components/MetricList'
import { NumberField } from '../components/NumberField'
import { PageTitle } from '../components/PageTitle'
import { SeriesChart } from '../components/SeriesChart'
import { apiRequest } from '../lib/api'

export function SimulationPage({ type }) {
  const isPendulum = type === 'pendulum'
  const [form, setForm] = useState(
    isPendulum
      ? { angle0: 0.1, velocity0: 0, duration: 10 }
      : { ball_position0: 0.1, beam_angle0: 0, duration: 10 },
  )
  const [data, setData] = useState(null)
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef(null)
  const previousTimeRef = useRef(0)

  const config = isPendulum
    ? {
        eyebrow: 'Simulacia',
        title: 'Obratene kyvadlo',
        text: 'API vracia cas, polohu vozika, uhol kyvadla a final_state pre pokracovanie.',
        endpoint: '/simulate/pendulum',
        primary: 'angle',
        secondary: 'position',
        labels: ['Uhol', 'Poloha'],
      }
    : {
        eyebrow: 'Simulacia',
        title: 'Gulicka na nosniku',
        text: 'API vracia polohu gulicky, uhol nosnika a final_state pre dalsi beh.',
        endpoint: '/simulate/ballbeam',
        primary: 'ball_position',
        secondary: 'beam_angle',
        labels: ['Poloha gulicky', 'Uhol nosnika'],
      }

  const maxFrame = Math.max((data?.t?.length ?? 1) - 1, 0)

  useEffect(() => {
    if (!playing || !data?.t?.length) return undefined

    const animate = (timestamp) => {
      if (!previousTimeRef.current) previousTimeRef.current = timestamp
      const elapsed = timestamp - previousTimeRef.current

      if (elapsed > 40) {
        previousTimeRef.current = timestamp
        setFrame((current) => {
          if (current >= maxFrame) {
            setPlaying(false)
            return maxFrame
          }
          return current + 1
        })
      }

      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(requestRef.current)
      previousTimeRef.current = 0
    }
  }, [playing, data, maxFrame])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: Number(value) }))
  }

  async function runSimulation(nextForm = form) {
    setLoading(true)
    setError('')
    setPlaying(false)
    try {
      const result = await apiRequest(config.endpoint, {
        method: 'POST',
        body: JSON.stringify(nextForm),
      })
      setData(result)
      setFrame(0)
      setPlaying(true)
      apiRequest('/stats/record', {
        method: 'POST',
        body: JSON.stringify({ animation: type }),
      }).catch(() => {})
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function continueSimulation() {
    if (!data?.final_state) return
    runSimulation({ ...form, final_state: data.final_state })
  }

  const currentValues = useMemo(() => {
    if (!data) return []
    return [
      ['t', data.t?.[frame]],
      [config.primary, data[config.primary]?.[frame]],
      [config.secondary, data[config.secondary]?.[frame]],
    ]
  }, [config.primary, config.secondary, data, frame])

  return (
    <section className="workspace">
      <PageTitle eyebrow={config.eyebrow} title={config.title} text={config.text} />

      <div className="simulation-layout">
        <form className="control-panel" onSubmit={(event) => event.preventDefault()}>
          {isPendulum ? (
            <>
              <NumberField
                label="Pociatocny uhol"
                value={form.angle0}
                step="0.01"
                onChange={(value) => updateField('angle0', value)}
              />
              <NumberField
                label="Pociatocna rychlost"
                value={form.velocity0}
                step="0.01"
                onChange={(value) => updateField('velocity0', value)}
              />
            </>
          ) : (
            <>
              <NumberField
                label="Pociatocna poloha gulicky"
                value={form.ball_position0}
                step="0.01"
                onChange={(value) => updateField('ball_position0', value)}
              />
              <NumberField
                label="Pociatocny uhol nosnika"
                value={form.beam_angle0}
                step="0.01"
                onChange={(value) => updateField('beam_angle0', value)}
              />
            </>
          )}
          <NumberField
            label="Trvanie"
            value={form.duration}
            min="1"
            step="1"
            onChange={(value) => updateField('duration', value)}
          />

          <div className="button-row">
            <button disabled={loading} type="button" onClick={() => runSimulation()}>
              Spustit
            </button>
            <button disabled={!data?.final_state || loading} type="button" onClick={continueSimulation}>
              Pokracovat
            </button>
            <button disabled={!data} type="button" onClick={() => setPlaying((value) => !value)}>
              {playing ? 'Pauza' : 'Play'}
            </button>
          </div>

          <input
            aria-label="Casova os animacie"
            disabled={!data}
            max={maxFrame}
            min="0"
            type="range"
            value={frame}
            onChange={(event) => setFrame(Number(event.target.value))}
          />

          {error && <p className="error-text">{error}</p>}
          <MetricList values={currentValues} />
        </form>

        <div className="visual-stack">
          <CanvasScene data={data} frame={frame} type={type} />
          <SeriesChart data={data} frame={frame} config={config} />
        </div>
      </div>
    </section>
  )
}
