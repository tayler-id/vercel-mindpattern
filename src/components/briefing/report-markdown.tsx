import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Some issues write Top 5 stories as plain prose blocks separated by ---
 * with no headline line at all, which reads as one long wall. Bold the
 * first paragraph of any story block that has no heading or bold lead so
 * each story visibly starts. Presentation only; the canonical newsletter
 * text is untouched.
 */
export function boldStoryLeads(content: string): string {
  const lines = content.split('\n')
  const out: string[] = []
  let atBlockStart = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const stripped = line.trim()
    if (/^(---+|\*\*\*+)$/.test(stripped) || /^##\s/.test(stripped)) {
      atBlockStart = true
      out.push(line)
      continue
    }
    if (atBlockStart && stripped) {
      atBlockStart = false
      const isPlainProse =
        !stripped.startsWith('#') &&
        !stripped.startsWith('**') &&
        !stripped.startsWith('-') &&
        !stripped.startsWith('>') &&
        !/^\d+\./.test(stripped)
      if (isPlainProse) {
        out.push(`**${stripped}**`)
        continue
      }
    }
    out.push(line)
  }
  return out.join('\n')
}

/** Newsreader-serif briefing renderer, Signal-toned. No left-border callouts. */
export function ReportMarkdown({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="mb-4 border-b border-line pb-2 font-mono text-[0.75rem] font-bold uppercase tracking-[0.12em] text-primary">
            {children}
          </h2>
        ),
        h2: ({ children }) => (
          <h3 className="mt-9 border-b border-line pb-2 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-primary">
            {children}
          </h3>
        ),
        h3: ({ children }) => (
          <h4 className="mb-2 mt-6 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-primary">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="mb-[1.125rem] font-serif text-[1.0625rem] leading-[1.72] text-[#23262c]">
            {children}
          </p>
        ),
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="mb-[1.125rem] ml-4 flex list-disc flex-col gap-1.5 font-serif text-[1.0625rem] leading-[1.72] text-[#23262c] marker:text-primary/50">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-[1.125rem] ml-4 flex list-decimal flex-col gap-1.5 font-serif text-[1.0625rem] leading-[1.72] text-[#23262c] marker:text-primary/50">
            {children}
          </ol>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-5 rounded-[var(--radius)] border border-line bg-panel px-4 py-3 font-serif italic text-ink-soft">
            {children}
          </blockquote>
        ),
        hr: () => (
          <div className="my-8 flex items-center gap-3" role="separator">
            <span className="h-px flex-1 bg-line" />
            <span className="font-mono text-[0.5625rem] tracking-[0.3em] text-ink-faint">///</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        ),
        code: ({ children }) => (
          <code className="rounded-[0.375rem] bg-accent-wash px-1.5 py-0.5 font-mono text-[0.8125rem] text-primary">
            {children}
          </code>
        ),
        table: ({ children }) => (
          <div className="my-5 overflow-x-auto">
            <table className="w-full border-collapse font-sans text-[0.8125rem]">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b-2 border-line bg-panel px-3 py-2 text-left font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-line-soft px-3 py-2">{children}</td>
        ),
      }}
    >
      {boldStoryLeads(content)}
    </Markdown>
  )
}
