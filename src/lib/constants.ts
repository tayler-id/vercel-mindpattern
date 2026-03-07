export const AGENTS = [
  { id: 'news-researcher', name: 'News', focus: 'Breaking AI industry news' },
  { id: 'vibe-coding-researcher', name: 'Vibe Coding', focus: 'AI coding tools, techniques, patterns' },
  { id: 'thought-leaders-researcher', name: 'Thought Leaders', focus: 'Person-attributed takes from AI community' },
  { id: 'agents-researcher', name: 'Agents', focus: 'AI agent frameworks, tools, deployments' },
  { id: 'projects-researcher', name: 'Projects', focus: 'Hot repos, open-source apps, demos' },
  { id: 'sources-researcher', name: 'Sources', focus: 'Best newsletters, blogs, videos, papers' },
  { id: 'saas-disruption-researcher', name: 'SaaS Disruption', focus: 'AI displacing SaaS categories' },
  { id: 'skill-finder', name: 'Skills', focus: 'Actionable developer skills and techniques' },
  { id: 'hn-researcher', name: 'Hacker News', focus: 'Top HN stories via Algolia API' },
  { id: 'arxiv-researcher', name: 'arXiv', focus: 'cs.AI / cs.LG / cs.CL papers' },
  { id: 'github-pulse-researcher', name: 'GitHub Pulse', focus: 'OSS repos gaining stars' },
  { id: 'rss-researcher', name: 'RSS', focus: '15 authoritative AI newsletters & blogs' },
  { id: 'reddit-researcher', name: 'Reddit', focus: 'r/ML, r/LocalLLaMA, r/SaaS top posts' },
] as const

export const IMPORTANCE_COLORS = {
  high: 'text-red-400 bg-red-400/10 border-red-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  low: 'text-green-400 bg-green-400/10 border-green-400/20',
} as const
