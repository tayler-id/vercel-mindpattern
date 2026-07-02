export function TrendIndicator({ trend }: { trend?: 'up' | 'down' | 'flat' | string }) {
  if (trend === 'up') {
    return <span className="font-mono text-[0.6875rem] font-bold text-ok" aria-label="trending up">▲</span>
  }
  if (trend === 'down') {
    return <span className="font-mono text-[0.6875rem] font-bold text-primary" aria-label="trending down">▼</span>
  }
  if (trend === 'flat') {
    return <span className="font-mono text-[0.6875rem] text-ink-faint" aria-label="steady">–</span>
  }
  return null
}
