export function formatNumber(value, digits = 3) {
  if (Number.isNaN(Number(value))) return '-'
  return Number(value).toFixed(digits)
}
