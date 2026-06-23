export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mindpattern.ai'
export const SITE_NAME = 'MindPattern'
export const SITE_TITLE = 'MindPattern - AI Research Intelligence'
export const SITE_DESCRIPTION =
  'MindPattern is an autonomous AI research pipeline that monitors news, papers, GitHub, Reddit, Hacker News, arXiv, RSS, and expert commentary to produce searchable daily intelligence briefings.'

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString()
}

export function shortReportDescription(title: string, date: string) {
  return `${title} is a MindPattern daily AI research briefing for ${date}, summarizing high-signal AI news, agent frameworks, developer tools, research papers, sources, and patterns.`
}
