import { z } from 'zod'
import { backendFetch } from './api'
import type { Finding, Stats, Pattern, Source, Skill, HealthData, ReportListItem, Report, ReportSearchResult } from './types'

async function safeFetch<T>(path: string, params?: Record<string, string>): Promise<T | { error: string }> {
  try {
    return await backendFetch<T>(path, params)
  } catch (e) {
    return { error: `Failed to fetch ${path}: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export const mcpTools = {
  search_findings: {
    description: 'Semantic vector search across all research findings. Use this when the user asks about a topic, wants to know what the agents found about something, or asks "what do you know about X".',
    inputSchema: z.object({
      query: z.string().describe('The search query - natural language'),
      limit: z.number().default(10).describe('Max results to return'),
    }),
    execute: async ({ query, limit }: { query: string; limit: number }) => {
      return safeFetch<Finding[]>('/api/search', {
        q: query,
        limit: String(limit),
        user: 'ramsay',
      })
    },
  },

  list_findings: {
    description: 'List research findings with optional filters by agent, importance level, or date. Use this to browse what a specific agent found, or to see all high-importance findings.',
    inputSchema: z.object({
      agent: z.string().optional().describe('Filter by agent name (e.g., "news-researcher", "vibe-coding-researcher")'),
      importance: z.enum(['high', 'medium', 'low']).optional().describe('Filter by importance level'),
      date: z.string().optional().describe('Filter by date (YYYY-MM-DD)'),
    }),
    execute: async ({ agent, importance, date }: { agent?: string; importance?: string; date?: string }) => {
      const params: Record<string, string> = { user: 'ramsay' }
      if (agent) params.agent = agent
      if (importance) params.importance = importance
      if (date) params.date = date
      return safeFetch<Finding[]>('/api/findings', params)
    },
  },

  get_stats: {
    description: 'Get aggregate statistics: total findings, sources, patterns, skills, plus breakdowns by agent and by date. Use this when the user asks "how much data do we have" or "show me the overview".',
    inputSchema: z.object({}),
    execute: async () => {
      return safeFetch<Stats>('/api/stats', { user: 'ramsay' })
    },
  },

  get_patterns: {
    description: 'Get recurring themes and patterns identified across multiple research runs. Use this when the user asks about trends, recurring topics, or what themes keep coming up.',
    inputSchema: z.object({}),
    execute: async () => {
      return safeFetch<Pattern[]>('/api/patterns', { user: 'ramsay' })
    },
  },

  get_sources: {
    description: 'Get the top research sources ranked by quality and frequency. Shows which domains produce the most high-value findings. Use when the user asks about where information comes from.',
    inputSchema: z.object({}),
    execute: async () => {
      return safeFetch<Source[]>('/api/sources', { user: 'ramsay' })
    },
  },

  search_skills: {
    description: 'Semantic search across actionable developer skills and techniques found by the skill-finder agent. Use when the user asks "how do I do X" or "teach me about Y".',
    inputSchema: z.object({
      query: z.string().describe('Skill topic to search for'),
      limit: z.number().default(10),
    }),
    execute: async ({ query, limit }: { query: string; limit: number }) => {
      return safeFetch<Skill[]>('/api/skills/search', {
        q: query,
        limit: String(limit),
        user: 'ramsay',
      })
    },
  },

  list_skills: {
    description: 'List skills filtered by domain. Use when the user wants to browse skills in a category like "vibe-coding" or "agent-patterns".',
    inputSchema: z.object({
      domain: z.string().optional().describe('Filter by domain (e.g., "vibe-coding", "agent-patterns", "ml-ops")'),
    }),
    execute: async ({ domain }: { domain?: string }) => {
      const params: Record<string, string> = { user: 'ramsay' }
      if (domain) params.domain = domain
      return safeFetch<Skill[]>('/api/skills', params)
    },
  },

  get_health: {
    description: 'Get system health data: pipeline run quality scores (last 30 days), per-agent activity stats, recent errors/warnings, approval queue status. Use when the user asks about system performance, agent health, or "how are things running".',
    inputSchema: z.object({}),
    execute: async () => {
      return safeFetch<HealthData>('/api/health', { user: 'ramsay' })
    },
  },

  list_reports: {
    description: 'List all daily newsletter reports with dates and titles. Use when the user asks "show me all newsletters", "what reports do we have", or wants to browse the archive.',
    inputSchema: z.object({}),
    execute: async () => {
      return safeFetch<ReportListItem[]>('/api/reports', { user: 'ramsay' })
    },
  },

  read_report: {
    description: 'Read a specific daily newsletter report by date. Returns the full markdown content. Use when the user asks to "show me the report from February 20th" or "what happened on 2026-02-25". Also use this to answer detailed questions about a specific day.',
    inputSchema: z.object({
      date: z.string().describe('Report date in YYYY-MM-DD format'),
    }),
    execute: async ({ date }: { date: string }) => {
      return safeFetch<Report | null>(`/api/reports/${date}`, { user: 'ramsay' })
    },
  },

  search_reports: {
    description: 'Full-text search across all daily newsletter reports. Returns matching excerpts with context. Use when the user asks "which newsletter mentioned X", "find the report about Y", or wants to find something across the newsletter archive.',
    inputSchema: z.object({
      query: z.string().describe('Search term to find in reports'),
      limit: z.number().default(10),
    }),
    execute: async ({ query, limit }: { query: string; limit: number }) => {
      return safeFetch<ReportSearchResult[]>('/api/reports/search', {
        q: query,
        limit: String(limit),
        user: 'ramsay',
      })
    },
  },
}
