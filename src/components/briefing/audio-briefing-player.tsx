import { ExternalLink, FileText, Headphones } from 'lucide-react'
import { backendAssetUrl } from '@/lib/api'
import type { AudioBriefing } from '@/lib/types'

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Audio'
  const minutes = Math.max(1, Math.round(seconds / 60))
  return `${minutes} min listen`
}

export function AudioBriefingPlayer({
  audio,
  compact = false,
}: {
  audio: AudioBriefing
  compact?: boolean
}) {
  const audioSrc = audio.has_audio_file && audio.public_url ? backendAssetUrl(audio.public_url) : ''
  const transcriptHref = audio.transcript_url ? backendAssetUrl(audio.transcript_url) : ''
  const visibleLabels = audio.labels.filter((label) => label.trim())

  return (
    <section
      className={
        compact
          ? 'mt-3 border-t border-line-soft pt-3'
          : 'my-8 border-y border-ink py-5'
      }
      aria-label="Audio briefing"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="type-kicker flex items-center gap-2 text-primary">
            <Headphones aria-hidden className="h-3.5 w-3.5" />
            Audio briefing
          </p>
          {!compact && (
            <p className="type-kicker mt-1 text-ink-faint">
              {formatDuration(audio.duration_seconds)} · {audio.source_count} sources
            </p>
          )}
        </div>

        {transcriptHref && (
          <a
            href={transcriptHref}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-panel px-4 py-2 font-mono text-[0.65625rem] font-semibold uppercase tracking-[0.1em] text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            <FileText aria-hidden className="h-3.5 w-3.5" />
            Transcript
          </a>
        )}
      </div>

      {audioSrc ? (
        <audio
          controls
          preload="none"
          src={audioSrc}
          className="mt-3 h-10 w-full max-w-full rounded-full accent-primary"
          aria-label={`Audio briefing for ${audio.date}`}
        />
      ) : (
        <p className="mt-3 font-mono text-[0.71875rem] text-ink-faint">Audio file pending.</p>
      )}

      {!compact && (
        <div className="type-kicker mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-faint">
          {visibleLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
          {audio.show_notes.slice(0, 2).map((note) => (
            <a
              key={note.url}
              href={note.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-panel px-3 py-1 text-ink transition-all duration-[var(--dur-fast)] ease-[var(--ease-swift)] hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
            >
              {note.label}
              <ExternalLink aria-hidden className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
