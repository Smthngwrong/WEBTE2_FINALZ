import { formatNumber } from '../lib/format'

export function MetricList({ values }) {
  if (!values.length) {
    return <p className="muted">Po spusteni sa tu zobrazi aktualny stav.</p>
  }

  return (
    <dl className="metric-list">
      {values.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{formatNumber(value)}</dd>
        </div>
      ))}
    </dl>
  )
}
