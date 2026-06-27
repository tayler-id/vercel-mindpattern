/** Wire filter tabs. Visual for now — Trending (high-signal) is the live view;
 *  Latest/Topics wire up with the feed API in M1/M2. */
export function WireTabs() {
  const tabs = ['Trending', 'Latest', 'Topics']
  return (
    <div className="mt-[18px] flex gap-1 border-b border-line">
      {tabs.map((t, i) => (
        <span
          key={t}
          aria-current={i === 0 ? 'page' : undefined}
          className={`-mb-px border-b-2 px-3 py-2.5 text-[0.78125rem] font-semibold ${
            i === 0 ? 'border-primary text-primary' : 'border-transparent text-ink-faint'
          }`}
        >
          {t}
        </span>
      ))}
    </div>
  )
}
