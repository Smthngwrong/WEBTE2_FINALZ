export function SeriesChart({ data, frame, config }) {
  const width = 860
  const height = 260
  const padding = 34

  if (!data?.t?.length) {
    return (
      <div className="empty-chart">
        <span>Graf sa zobrazi po nacitani vysledkov zo simulacie.</span>
      </div>
    )
  }

  const values = [...data[config.primary], ...data[config.secondary]]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const toX = (index) => padding + (index / (data.t.length - 1 || 1)) * (width - padding * 2)
  const toY = (value) => height - padding - ((value - min) / range) * (height - padding * 2)
  const toPath = (series) =>
    series
      .map((value, index) => `${index === 0 ? 'M' : 'L'} ${toX(index)} ${toY(value)}`)
      .join(' ')
  const cursorX = toX(frame)

  return (
    <svg className="series-chart" viewBox={`0 0 ${width} ${height}`} role="img">
      <title>Casovy graf simulacie</title>
      <rect x="0" y="0" width={width} height={height} rx="8" />
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} />
      <path className="series-primary" d={toPath(data[config.primary])} />
      <path className="series-secondary" d={toPath(data[config.secondary])} />
      <line className="chart-cursor" x1={cursorX} x2={cursorX} y1={padding} y2={height - padding} />
      <text x={padding} y="22">
        {config.labels[0]}
      </text>
      <text className="secondary-label" x={padding + 110} y="22">
        {config.labels[1]}
      </text>
    </svg>
  )
}
