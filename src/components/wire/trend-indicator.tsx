export function TrendIndicator({ trend }: { trend?: 'up' | 'down' | 'flat' | string }) {
  if (trend === 'up') {
    return (
      <span
        className="font-mono text-[0.6875rem] font-bold text-ok transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)"
        aria-label="trending up"
      >
        ▲
      </span>
    )
  }
  if (trend === 'down') {
    return (
      <span
        className="font-mono text-[0.6875rem] font-bold text-primary transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)"
        aria-label="trending down"
      >
        ▼
      </span>
    )
  }
  if (trend === 'flat') {
    return (
      <span
        className="font-mono text-[0.6875rem] text-ink-faint transition-colors group-hover:text-(--tc-on) group-focus-within:text-(--tc-on)"
        aria-label="steady"
      >
        –
      </span>
    )
  }
  return null
}
