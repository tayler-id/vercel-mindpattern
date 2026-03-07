import { NextResponse } from 'next/server'

// MCP server lives on Fly.io at /mcp endpoint
// This route provides info about the MCP server location

export async function GET() {
  return NextResponse.json({
    mcp_server: process.env.BACKEND_API_URL + '/mcp',
    transport: 'streamable-http',
    tools: [
      'search_findings', 'list_findings', 'get_stats', 'get_patterns',
      'get_sources', 'search_skills', 'list_skills', 'get_health',
      'list_reports', 'read_report', 'search_reports',
    ],
  })
}
