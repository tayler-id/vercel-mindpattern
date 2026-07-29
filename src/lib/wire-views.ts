/**
 * The wire's tabs (Trending / Latest / Topics / Most read) are views on one
 * route, selected by `?view=`. They are shared as links, so the heading, the
 * share title, the page metadata, and the social card all have to agree on
 * what a view is called — hence one registry instead of four copies.
 */

export const WIRE_VIEWS = ['trending', 'most-read', 'latest', 'topics'] as const

export type WireView = (typeof WIRE_VIEWS)[number]

export const DEFAULT_WIRE_VIEW: WireView = 'trending'

export const WIRE_HEADING: Record<WireView, { h1: string; sub: string; share: string }> = {
  trending: {
    h1: 'Trending now',
    sub: 'reader signal + source recurrence',
    share: 'Trending now on MindPattern',
  },
  'most-read': {
    h1: 'Most read',
    sub: 'all-time reader favorites',
    share: 'The most-read AI intelligence on MindPattern',
  },
  latest: {
    h1: 'Latest signals',
    sub: 'most recent first',
    share: 'The latest AI signals on MindPattern',
  },
  topics: {
    h1: 'By topic',
    sub: 'grouped by section',
    share: 'AI intelligence by topic on MindPattern',
  },
}

export function isWireView(value: string | undefined): value is WireView {
  return WIRE_VIEWS.includes((value ?? '') as WireView)
}

export function resolveWireView(value: string | undefined): WireView {
  return isWireView(value) ? value : DEFAULT_WIRE_VIEW
}

/** Trending is the bare route; every other view carries its `?view=` tag. */
export function wireViewPath(view: WireView): string {
  return view === DEFAULT_WIRE_VIEW ? '/' : `/?view=${view}`
}
