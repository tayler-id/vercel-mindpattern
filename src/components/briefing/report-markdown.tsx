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

/**
 * Spectrum long-form renderer. Emits the same `data-streamdown` hooks the
 * `.streamdown-wire-room` stylesheet in globals.css already targets, so the
 * static react-markdown path and the streaming path share one visual system:
 * Archivo headings on ink top rules, Source Serif body, 2px topic-color link
 * underlines, and Archivo-bold blockquotes ruled top (topic) and bottom (ink).
 * Set --tc on an ancestor to tint links/quotes; defaults to the accent.
 */
export function ReportMarkdown({ content }: { content: string }) {
  return (
    <div className="streamdown-wire-room">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 data-streamdown="heading-1">{children}</h2>,
          h2: ({ children }) => <h3 data-streamdown="heading-2">{children}</h3>,
          h3: ({ children }) => <h4 data-streamdown="heading-3">{children}</h4>,
          // rel="noopener" without noreferrer: noopener is what closes the
          // window.opener hole, while noreferrer also strips the Referer
          // header, so every source a story links out to never saw
          // mindpattern.ai in its referral logs.
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener" data-streamdown="link">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc marker:text-ink-soft">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal marker:text-ink-soft">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote data-streamdown="blockquote">{children}</blockquote>
          ),
          code: ({ children }) => <code data-streamdown="code-inline">{children}</code>,
          pre: ({ children }) => (
            <pre data-streamdown="code-block" className="my-5 overflow-x-auto p-4">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table data-streamdown="table">{children}</table>
            </div>
          ),
        }}
      >
        {boldStoryLeads(content)}
      </Markdown>
    </div>
  )
}
