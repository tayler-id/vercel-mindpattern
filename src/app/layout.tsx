import type { Metadata, Viewport } from 'next'
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PageViewTracker } from '@/components/analytics/page-view'
import { WebVitalsTracker } from '@/components/analytics/web-vitals'
import { SearchHotkey } from '@/components/search/search-hotkey'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site'
import './globals.css'

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
})
const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})
const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // A page that sets no openGraph or twitter block of its own inherits these
  // two objects whole, so nothing page-specific may live in either. That rules
  // out four keys that used to be here.
  //
  // Title and description are gone because Next fills them from the page's own
  // resolved title and description. Hardcoding them served /explore, /blog and
  // /briefings the site title instead of theirs.
  //
  // `url` and `alternates.canonical` are gone because they were both '/', and
  // six route families inherit them, so /briefings advertised itself as a
  // duplicate of the homepage. Every page that wants one now declares it. The
  // homepage sets both in src/app/(app)/page.tsx.
  //
  // `images` is gone from both because src/app/opengraph-image.tsx already
  // supplies the card through the file convention, which the hand-written key
  // suppressed (mergeStaticMetadata skips a level that declares images). The
  // file convention adds the ?hash cache-buster crawlers need after the art
  // changes, and og:image:type. Twitter then auto-fills its images from the
  // resolved openGraph, which means a page with its own card keeps it instead
  // of inheriting the site card here.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexMono.variable} ${sourceSerif.variable}`}
    >
      <body suppressHydrationWarning className="font-sans antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
        <PageViewTracker />
        <WebVitalsTracker />
        <SearchHotkey />
      </body>
    </html>
  )
}
