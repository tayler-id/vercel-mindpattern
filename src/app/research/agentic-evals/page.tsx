import type { Metadata } from 'next'
import { Suspense } from 'react'
import AgenticEvalsInfographic from './infographic'

export const metadata: Metadata = {
  title: 'The State of Agentic AI Evaluation — MindPattern',
  description:
    'Key findings from the Hugging Face Agentic Evals Workshop, March 2026. 10-panel infographic covering eval transparency, reliability gaps, GAIA 2, and more.',
  openGraph: {
    title: 'The State of Agentic AI Evaluation — MindPattern',
    description:
      'Key findings from the Hugging Face Agentic Evals Workshop, March 2026. 10-panel infographic covering eval transparency, reliability gaps, GAIA 2, and more.',
    images: [
      {
        url: '/research/agentic-evals/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The State of Agentic AI Evaluation',
      },
    ],
    type: 'article',
    siteName: 'MindPattern',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The State of Agentic AI Evaluation — MindPattern',
    description:
      'Key findings from the Hugging Face Agentic Evals Workshop, March 2026. 10-panel infographic.',
    images: ['/research/agentic-evals/og-image.png'],
  },
}

export default function AgenticEvalsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#d8d5cf' }} />}>
      <AgenticEvalsInfographic />
    </Suspense>
  )
}
