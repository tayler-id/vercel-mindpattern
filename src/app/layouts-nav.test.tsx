import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HeaderNav, BottomTabBar } from '@/components/shell/site-nav'
import { SidebarNav } from '@/components/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

const nav = vi.hoisted(() => ({
  pathname: '/briefings',
}))

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/font/google', () => ({
  Archivo: () => ({ variable: 'font-archivo' }),
  IBM_Plex_Mono: () => ({ variable: 'font-plex-mono' }),
  Source_Serif_4: () => ({ variable: 'font-source-serif' }),
}))

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="analytics" />,
}))

vi.mock('@/components/analytics/web-vitals', () => ({
  WebVitalsTracker: () => <div data-testid="web-vitals" />,
}))

vi.mock('@/components/search/search-hotkey', () => ({
  SearchHotkey: () => <div data-testid="search-hotkey" />,
}))

vi.mock('@/components/newsletter-signup', () => ({
  NewsletterSignup: () => <div data-testid="newsletter-signup" />,
}))

describe('layouts and navigation', () => {
  beforeEach(() => {
    nav.pathname = '/briefings'
  })

  it('renders root layout metadata wrappers and global helpers', async () => {
    const { default: RootLayout, metadata, viewport } = await import('./layout')

    expect(metadata.applicationName).toBe('MindPattern')
    expect(viewport.themeColor).toBe('#ffffff')
    render(<RootLayout><main>Child</main></RootLayout>)

    expect(screen.getByText('Child')).toBeInTheDocument()
    expect(screen.getByTestId('analytics')).toBeInTheDocument()
    expect(screen.getByTestId('web-vitals')).toBeInTheDocument()
    expect(screen.getByTestId('search-hotkey')).toBeInTheDocument()
  })

  it('renders app, blog, explore, and unsubscribe layouts', async () => {
    const AppLayout = (await import('./(app)/layout')).default
    const BlogLayout = (await import('./(blog)/layout')).default
    const ExploreLayout = (await import('./(explore)/layout')).default
    const UnsubscribeLayout = (await import('./(unsubscribe)/layout')).default

    render(<AppLayout><div>App child</div></AppLayout>)
    expect(screen.getByRole('link', { name: 'MindPattern home' })).toHaveAttribute('href', '/')
    expect(screen.getByText('App child')).toBeInTheDocument()

    render(<BlogLayout><div>Blog child</div></BlogLayout>)
    expect(screen.getByText('Blog child')).toBeInTheDocument()

    render(<ExploreLayout><div>Explore child</div></ExploreLayout>)
    expect(screen.getByText('Explore child')).toBeInTheDocument()

    render(<UnsubscribeLayout><div>Unsubscribe child</div></UnsubscribeLayout>)
    expect(screen.getByText('Unsubscribe child')).toBeInTheDocument()
  })

  it('renders active header, bottom tabs, and sidebar navigation', () => {
    render(
      <>
        <HeaderNav />
        <BottomTabBar />
        <SidebarProvider>
          <SidebarNav />
        </SidebarProvider>
      </>,
    )

    expect(screen.getAllByRole('link', { name: 'Briefings' })[0]).toHaveAttribute('aria-current', 'page')
    fireEvent.mouseEnter(screen.getAllByRole('link', { name: 'Wire' })[0])
    fireEvent.focus(screen.getAllByRole('link', { name: 'Search' })[0])
    fireEvent.blur(screen.getAllByRole('link', { name: 'Search' })[0])
    fireEvent.mouseLeave(screen.getAllByRole('navigation', { name: 'Primary' })[0])
    expect(screen.getByRole('link', { name: 'Archives' })).toHaveAttribute('href', '/explore')
    expect(screen.getByTestId('newsletter-signup')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /New Case/ }))
    expect(window.location.href).toBe('http://localhost:3000/')

    nav.pathname = '/search'
    render(<HeaderNav />)
    expect(screen.getAllByRole('link', { name: 'Search' }).at(-1)).toHaveAttribute('aria-current', 'page')

    nav.pathname = '/unknown'
    render(
      <>
        <HeaderNav />
        <BottomTabBar />
      </>,
    )
    expect(screen.getAllByRole('link', { name: 'Wire' }).at(-1)).not.toHaveAttribute('aria-current')
  })
})
