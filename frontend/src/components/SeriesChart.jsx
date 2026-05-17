function SingleChart({ series, label, frame, className, tLength }) {
  const width = 860
  const height = 200
  const padding = 34

  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1
  const toX = (index) => padding + (index / (tLength - 1 || 1)) * (width - padding * 2)
  const toY = (value) => height - padding - ((value - min) / range) * (height - padding * 2)
  const toPath = (s) =>
    s.map((value, index) => `${index === 0 ? 'M' : 'L'} ${toX(index)} ${toY(value)}`).join(' ')
  const cursorX = toX(frame)

  return (
    <svg className={`series-chart ${className}`} viewBox={`0 0 ${width} ${height}`} role="img">
      <title>{label}</title>
      <rect x="0" y="0" width={width} height={height} rx="8" />
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} />
      <path className={className} d={toPath(series)} />
      <line className="chart-cursor" x1={cursorX} x2={cursorX} y1={padding} y2={height - padding} />
      <text x={padding} y="22">
        {label}
      </text>
    </svg>
  )
}

export function SeriesChart({ data, frame, config }) {
  if (!data?.t?.length) {
    return (
      <div className="empty-chart">
        <span>Graf sa zobrazi po nacitani vysledkov zo simulacie.</span>
      </div>
    )
  }

  return (
    <div className="chart-stack">
      <SingleChart
        series={data[config.primary]}
        label={config.labels[0]}
        frame={frame}
        className="series-primary"
        tLength={data.t.length}
      />
      <SingleChart
        series={data[config.secondary]}
        label={config.labels[1]}
        frame={frame}
        className="series-secondary"
        tLength={data.t.length}
      />
    </div>
  )
}
