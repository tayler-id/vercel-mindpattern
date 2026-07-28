import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AudioBriefingPlayer } from './audio-briefing-player'
import { boldStoryLeads, ReportMarkdown } from './report-markdown'
import { VideoEmbed } from '../video/video-embed'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    backendAssetUrl: (path: string) => `https://assets.test${path}`,
  }
})

describe('briefing components', () => {
  it('bolds plain story leads after separators or h2 headings', () => {
    expect(boldStoryLeads('## Top\nPlain lead\n- bullet\n---\n**Already bold**')).toBe(
      '## Top\n**Plain lead**\n- bullet\n---\n**Already bold**',
    )
    expect(boldStoryLeads('---\n1. Numbered item')).toBe('---\n1. Numbered item')
  })

  it('renders markdown headings, links, tables, code, quotes, and separators', () => {
    render(
      <ReportMarkdown
        content={`# Headline\n\n## Section\n\n### Detail\n\nParagraph with [link](https://example.com) and \`code\`.\n\n- Bullet\n\n1. Step\n\n> Quote\n\n\`\`\`\nblock()\n\`\`\`\n\n---\n\n| A | B |\n| - | - |\n| 1 | 2 |`}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Headline' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Section' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Detail' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'link' })).toHaveAttribute('href', 'https://example.com')
    expect(screen.getByText('code')).toBeInTheDocument()
    expect(screen.getByText('Bullet')).toBeInTheDocument()
    expect(screen.getByText('Step')).toBeInTheDocument()
    expect(screen.getByText('Quote')).toBeInTheDocument()
    expect(screen.getByText(/block/)).toBeInTheDocument()
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('renders audio briefing media, transcripts, labels, and notes', () => {
    render(
      <AudioBriefingPlayer
        audio={{
          date: '2026-07-02',
          title: 'Daily audio',
          has_audio_file: true,
          public_url: '/audio.mp3',
          transcript_url: '/transcript.txt',
          duration_seconds: 121,
          source_count: 5,
          labels: ['AI', ' ', 'Agents'],
          show_notes: [
            { label: 'Source A', url: 'https://example.com/a' },
            { label: 'Source B', url: 'https://example.com/b' },
            { label: 'Source C', url: 'https://example.com/c' },
          ],
        }}
      />,
    )

    expect(screen.getByLabelText('Audio briefing for 2026-07-02')).toHaveAttribute('src', 'https://assets.test/audio.mp3')
    expect(screen.getByRole('link', { name: /Transcript/ })).toHaveAttribute('href', 'https://assets.test/transcript.txt')
    expect(screen.getByText('2 min listen · 5 sources')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.queryByText('Source C')).not.toBeInTheDocument()
  })

  it('renders compact pending audio without optional metadata', () => {
    const { rerender } = render(
      <AudioBriefingPlayer
        compact
        audio={{
          date: '2026-07-02',
          title: 'Pending audio',
          has_audio_file: false,
          public_url: '',
          transcript_url: '',
          duration_seconds: 0,
          source_count: 0,
          labels: [],
          show_notes: [],
        }}
      />,
    )

    expect(screen.getByText('Audio file pending.')).toBeInTheDocument()
    expect(screen.queryByText(/sources/)).not.toBeInTheDocument()

    rerender(
      <AudioBriefingPlayer
        audio={{
          date: '2026-07-03',
          title: 'Zero audio',
          has_audio_file: false,
          public_url: '',
          transcript_url: '',
          duration_seconds: 0,
          source_count: 0,
          labels: [],
          show_notes: [],
        }}
      />,
    )
    expect(screen.getByText('Audio · 0 sources')).toBeInTheDocument()
  })

  it('uses a click-to-load YouTube facade', () => {
    const { container, rerender } = render(<VideoEmbed url="https://youtu.be/abcDEF_1234" title="Demo video" />)

    expect(screen.getByRole('button', { name: 'Play video: Demo video' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTitle('Demo video')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/abcDEF_1234?autoplay=1',
    )

    rerender(<VideoEmbed url="https://example.com/video" title="Bad video" />)
    expect(container).toBeEmptyDOMElement()
  })
})
