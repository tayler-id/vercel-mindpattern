'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useSearchParams } from 'next/navigation'

export default function AgenticEvalsInfographic() {
  const carouselRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const totalPanels = 10

  const searchParams = useSearchParams()
  const utmSource = searchParams.get('utm_source') || ''
  const utmMedium = searchParams.get('utm_medium') || ''
  const utmCampaign = searchParams.get('utm_campaign') || ''

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return
    const handleScroll = () => {
      const idx = Math.round(carousel.scrollLeft / 1080)
      setCurrentIndex(idx)
    }
    carousel.addEventListener('scroll', handleScroll)
    return () => carousel.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') scrollPanel(1)
      if (e.key === 'ArrowLeft') scrollPanel(-1)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  function getCurrentIndex() {
    if (!carouselRef.current) return 0
    return Math.round(carouselRef.current.scrollLeft / 1080)
  }

  function scrollPanel(direction: number) {
    const panels = carouselRef.current?.querySelectorAll('.panel')
    if (!panels) return
    const target = Math.max(0, Math.min(totalPanels - 1, getCurrentIndex() + direction))
    panels[target].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  function scrollToPanel(index: number) {
    const panels = carouselRef.current?.querySelectorAll('.panel')
    if (!panels) return
    panels[index].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  async function downloadAll() {
    setDownloading(true)
    try {
      const html2canvas = (window as any).html2canvas
      if (!html2canvas) {
        alert('Export library still loading. Please try again in a moment.')
        setDownloading(false)
        return
      }
      const panels = carouselRef.current?.querySelectorAll('.panel')
      if (!panels) return
      for (let i = 0; i < panels.length; i++) {
        const canvas = await html2canvas(panels[i], {
          scale: 2,
          useCORS: true,
          width: 1080,
          height: 1350,
          backgroundColor: null,
        })
        const link = document.createElement('a')
        link.download = `agentic-evals-${String(i + 1).padStart(2, '0')}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        strategy="lazyOnload"
      />

      <style>{`
/* ============================================================
   RESET & VARIABLES
   ============================================================ */
.infographic-root *, .infographic-root *::before, .infographic-root *::after { margin: 0; padding: 0; box-sizing: border-box; }

.infographic-root {
  --ink:       #101010;
  --surface:   #F5F3EF;
  --surface-b: #EDEAE4;
  --accent:    #FA5D29;
  --muted:     #8A8680;
  --rule:      rgba(16,16,16,0.10);
  --rule-fine: rgba(16,16,16,0.06);

  --text-xs:    11px;
  --text-sm:    13px;
  --text-base:  15px;
  --text-md:    17px;
  --text-lg:    21px;
  --text-xl:    27px;
  --text-2xl:   33px;
  --text-3xl:   42px;
  --text-4xl:   52px;
  --text-5xl:   65px;
  --text-6xl:   80px;

  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;
  --sp-6: 32px;
  --sp-7: 40px;
  --sp-8: 48px;
  --sp-9: 56px;
  --sp-10: 64px;
  --sp-11: 80px;
  --sp-12: 96px;

  font-family: 'Inter Tight', -apple-system, sans-serif;
  background: #d8d5cf;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 40px 0 100px;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ============================================================
   CAROUSEL
   ============================================================ */
.infographic-root .carousel-wrapper {
  position: relative;
  width: 1080px;
  max-width: 100vw;
}

.infographic-root .carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
.infographic-root .carousel::-webkit-scrollbar { display: none; }

/* ============================================================
   PANEL — 1080 x 1350 (Instagram portrait)
   ============================================================ */
.infographic-root .panel {
  flex: 0 0 1080px;
  width: 1080px;
  height: 1350px;
  scroll-snap-align: start;
  background: var(--surface);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.infographic-root .panel-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 56px 80px 24px;
}

/* ============================================================
   TYPOGRAPHY
   ============================================================ */
.infographic-root .eyebrow {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: var(--sp-5);
}

.infographic-root .panel-num {
  position: absolute;
  top: 72px;
  right: 80px;
  font-size: var(--text-3xl);
  font-weight: 300;
  color: var(--rule);
  letter-spacing: -0.02em;
  line-height: 1;
}

.infographic-root h1 {
  font-size: var(--text-5xl);
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: -0.035em;
  margin-bottom: var(--sp-5);
  max-width: 820px;
}

.infographic-root h2 {
  font-size: var(--text-4xl);
  font-weight: 800;
  line-height: 1.0;
  letter-spacing: -0.03em;
  margin-bottom: var(--sp-5);
  max-width: 780px;
}

.infographic-root .section-label {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: var(--sp-4);
}

.infographic-root .lead {
  font-size: var(--text-md);
  font-weight: 400;
  line-height: 1.55;
  color: #555;
  max-width: 600px;
}

.infographic-root .body-text {
  font-size: var(--text-base);
  font-weight: 400;
  line-height: 1.6;
  color: #555;
}

/* ============================================================
   HORIZONTAL RULES
   ============================================================ */
.infographic-root .rule      { width: 100%; height: 1px; background: var(--rule); }
.infographic-root .rule-fine { width: 100%; height: 1px; background: var(--rule-fine); }

/* ============================================================
   SPACING UTILITIES
   ============================================================ */
.infographic-root .spacer { flex: 1; min-height: 16px; }
.infographic-root .gap-xs  { height: var(--sp-2); }
.infographic-root .gap-sm  { height: var(--sp-4); }
.infographic-root .gap-md  { height: var(--sp-6); }
.infographic-root .gap-lg  { height: var(--sp-8); }
.infographic-root .gap-xl  { height: var(--sp-10); }

/* ============================================================
   STAT STRIP
   ============================================================ */
.infographic-root .stat-strip {
  display: flex;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  margin-top: 12px;
}
.infographic-root .stat-cell {
  flex: 1;
  padding: 48px 28px 48px 0;
}
.infographic-root .stat-cell + .stat-cell {
  padding-left: 28px;
  border-left: 1px solid var(--rule);
}
.infographic-root .stat-val {
  font-size: var(--text-3xl);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 14px;
}
.infographic-root .stat-val .unit {
  font-size: var(--text-lg);
  font-weight: 400;
  color: var(--muted);
}
.infographic-root .stat-desc {
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--muted);
  line-height: 1.4;
}

/* ============================================================
   TWO-COLUMN GRID
   ============================================================ */
.infographic-root .two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
.infographic-root .two-col > .col-item {
  padding: 18px 0;
  border-bottom: 1px solid var(--rule-fine);
}
.infographic-root .two-col > .col-item:nth-child(odd) {
  padding-right: 24px;
  border-right: 1px solid var(--rule-fine);
}
.infographic-root .two-col > .col-item:nth-child(even) {
  padding-left: 24px;
}
.infographic-root .col-item .item-title {
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 3px;
  color: var(--ink);
}
.infographic-root .col-item .item-desc {
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--muted);
  line-height: 1.4;
}

/* ============================================================
   NUMBERED LIST
   ============================================================ */
.infographic-root .num-item {
  display: flex;
  gap: 20px;
  padding: 16px 0;
  border-bottom: 1px solid var(--rule-fine);
  align-items: baseline;
}
.infographic-root .num-item:last-child { border-bottom: none; }
.infographic-root .num-idx {
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--muted);
  flex-shrink: 0;
  width: 24px;
  font-variant-numeric: tabular-nums;
}
.infographic-root .num-body .num-title {
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: 2px;
}
.infographic-root .num-body .num-desc {
  font-size: var(--text-sm);
  color: var(--muted);
  line-height: 1.4;
}

/* ============================================================
   PROGRESS BARS
   ============================================================ */
.infographic-root .bar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--rule-fine);
}
.infographic-root .bar-row:last-child { border-bottom: none; }
.infographic-root .bar-label {
  width: 110px;
  font-size: var(--text-sm);
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: -0.01em;
}
.infographic-root .bar-track {
  flex: 1;
  height: 6px;
  background: rgba(16,16,16,0.05);
  border-radius: 3px;
  overflow: hidden;
}
.infographic-root .bar-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--ink);
  transition: width 0.6s ease-out;
}
.infographic-root .bar-fill.accent { background: var(--accent); }
.infographic-root .bar-fill.weak   { background: rgba(16,16,16,0.18); }
.infographic-root .bar-pct {
  width: 56px;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--muted);
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.infographic-root .bar-pct.accent { color: var(--accent); font-weight: 800; }

/* ============================================================
   DARK INSET BLOCK
   ============================================================ */
.infographic-root .dark-block {
  background: var(--ink);
  color: #fff;
  border-radius: 4px;
  padding: 36px 40px;
}
.infographic-root .dark-block .section-label { color: rgba(255,255,255,0.35); }
.infographic-root .dark-block .lead { color: rgba(255,255,255,0.60); }
.infographic-root .dark-block .bar-track { background: rgba(255,255,255,0.08); }
.infographic-root .dark-block .bar-fill { background: #fff; }
.infographic-root .dark-block .bar-fill.accent { background: var(--accent); }
.infographic-root .dark-block .bar-label { color: rgba(255,255,255,0.65); }
.infographic-root .dark-block .bar-pct { color: rgba(255,255,255,0.40); }

/* ============================================================
   ACCENT CALLOUT
   ============================================================ */
.infographic-root .callout {
  border-left: 2px solid var(--accent);
  padding: 14px 0 14px 24px;
}
.infographic-root .callout p {
  font-size: var(--text-base);
  font-weight: 500;
  line-height: 1.55;
  color: var(--ink);
  font-style: italic;
}

/* ============================================================
   INLINE STATUS ROWS
   ============================================================ */
.infographic-root .status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 0;
  border-bottom: 1px solid var(--rule-fine);
}
.infographic-root .status-row:last-child { border-bottom: none; }
.infographic-root .status-row .label {
  font-size: var(--text-base);
  font-weight: 500;
}
.infographic-root .status-row .badge {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.infographic-root .status-row .badge.critical { color: var(--accent); }
.infographic-root .status-row .badge.neutral  { color: var(--muted); }

/* ============================================================
   CTA GRID
   ============================================================ */
.infographic-root .cta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.infographic-root .cta-cell {
  padding: 14px 0;
  border-bottom: 1px solid var(--rule-fine);
  font-size: var(--text-base);
  font-weight: 500;
}
.infographic-root .cta-cell:nth-child(odd) {
  padding-right: 20px;
  border-right: 1px solid var(--rule-fine);
}
.infographic-root .cta-cell:nth-child(even) {
  padding-left: 20px;
}
.infographic-root .cta-arrow {
  color: var(--accent);
  margin-right: 10px;
  font-weight: 700;
}

/* ============================================================
   TAG / PILL
   ============================================================ */
.infographic-root .tag {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 5px 12px;
  border: 1px solid var(--rule);
  border-radius: 3px;
  color: var(--ink);
}
.infographic-root .tag.primary {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}

.infographic-root .tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ============================================================
   CHECK / X ITEMS
   ============================================================ */
.infographic-root .x-item {
  display: flex;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid var(--rule-fine);
  align-items: baseline;
}
.infographic-root .x-item:last-child { border-bottom: none; }
.infographic-root .x-mark {
  font-size: var(--text-md);
  font-weight: 800;
  color: var(--accent);
  flex-shrink: 0;
  width: 18px;
}
.infographic-root .x-text {
  font-size: var(--text-base);
  color: #555;
  line-height: 1.45;
}

.infographic-root .chk-item {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--rule-fine);
  align-items: center;
}
.infographic-root .chk-item:last-child { border-bottom: none; }
.infographic-root .chk-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink);
  flex-shrink: 0;
}
.infographic-root .chk-text {
  font-size: var(--text-base);
  color: #555;
  line-height: 1.45;
}

/* ============================================================
   BIG NUMBER
   ============================================================ */
.infographic-root .big-num {
  font-size: var(--text-6xl);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

/* ============================================================
   COMPARISON
   ============================================================ */
.infographic-root .comparison {
  display: flex;
  gap: 32px;
  align-items: flex-end;
}
.infographic-root .comparison-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.infographic-root .comp-bar-wrapper {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid var(--rule);
}
.infographic-root .comp-bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
}
.infographic-root .comp-value {
  font-size: var(--text-3xl);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-top: 10px;
}
.infographic-root .comp-label {
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--muted);
  margin-top: 4px;
}

/* ============================================================
   PANEL FOOTER
   ============================================================ */
.infographic-root .panel-footer {
  padding: 16px 80px;
  border-top: 1px solid var(--rule);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--muted);
  letter-spacing: 0.02em;
  flex-shrink: 0;
}
.infographic-root .panel-footer > span:last-child {
  text-align: right;
}
.infographic-root .panel-footer .brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--muted);
  transition: color 0.2s;
}
.infographic-root .panel-footer .brand:hover { color: var(--ink); }
.infographic-root .panel-footer .brand img {
  width: 20px;
  height: auto;
  opacity: 0.6;
}
.infographic-root .panel-footer .brand span {
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* ============================================================
   DIMENSION ROW — GAIA 2
   ============================================================ */
.infographic-root .dim-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--rule-fine);
}
.infographic-root .dim-row:last-child { border-bottom: none; }
.infographic-root .dim-name {
  width: 110px;
  font-size: var(--text-sm);
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: -0.01em;
}
.infographic-root .dim-bar-track {
  flex: 1;
  height: 24px;
  background: rgba(16,16,16,0.04);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}
.infographic-root .dim-bar-fill {
  height: 100%;
  border-radius: 2px;
  position: absolute;
  left: 0;
  top: 0;
}
.infographic-root .dim-val {
  width: 56px;
  font-size: var(--text-sm);
  font-weight: 700;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.infographic-root .dim-val.poor { color: var(--muted); }
.infographic-root .dim-val.fail { color: var(--accent); }

/* ============================================================
   METRIC PILLS
   ============================================================ */
.infographic-root .metric-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.infographic-root .metric-pill {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 3px;
  background: rgba(16,16,16,0.05);
  color: var(--ink);
}
.infographic-root .metric-pill.primary {
  background: var(--ink);
  color: #fff;
}

/* ============================================================
   SPEAKERS STRIP
   ============================================================ */
.infographic-root .speakers-strip {
  display: flex;
  gap: 0;
  border-top: 1px solid var(--rule);
}
.infographic-root .speaker-cell {
  flex: 1;
  padding: 20px 0;
  border-right: 1px solid var(--rule-fine);
}
.infographic-root .speaker-cell:last-child { border-right: none; }
.infographic-root .speaker-cell:not(:first-child) { padding-left: 20px; }
.infographic-root .speaker-name {
  font-size: var(--text-sm);
  font-weight: 700;
  margin-bottom: 2px;
}
.infographic-root .speaker-org {
  font-size: var(--text-xs);
  color: var(--muted);
  line-height: 1.35;
}

/* ============================================================
   WARNING BLOCK
   ============================================================ */
.infographic-root .warning-block {
  background: var(--ink);
  color: #fff;
  border-radius: 4px;
  padding: 24px 28px;
}
.infographic-root .warning-block p {
  font-size: var(--text-base);
  font-weight: 600;
  line-height: 1.5;
}
.infographic-root .warning-block .highlight { color: var(--accent); }

/* ============================================================
   NAVIGATION & CONTROLS
   ============================================================ */
.infographic-root .nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}
.infographic-root .nav-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.12);
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--ink);
  transition: border-color 0.3s ease-out;
}
.infographic-root .nav-btn:hover { border-color: var(--ink); }

.infographic-root .dots { display: flex; gap: 6px; }
.infographic-root .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0,0,0,0.12);
  cursor: pointer;
  transition: all 0.3s ease-out;
}
.infographic-root .dot.active {
  background: var(--ink);
  width: 24px;
  border-radius: 4px;
}

.infographic-root .dl-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: var(--ink);
  color: #fff;
  border: none;
  border-radius: 3px;
  font-family: 'Inter Tight', sans-serif;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: opacity 0.3s ease-out;
}
.infographic-root .dl-btn:hover { opacity: 0.85; }

.infographic-root .dl-btn-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.infographic-root .pdf-link {
  padding: 10px 20px;
  background: transparent;
  color: var(--ink);
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 3px;
  font-family: 'Inter Tight', sans-serif;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.02em;
  text-decoration: none;
  transition: border-color 0.3s ease-out;
}
.infographic-root .pdf-link:hover { border-color: var(--ink); }

/* ============================================================
   PANEL-SPECIFIC OVERRIDES
   ============================================================ */
.infographic-root .panel-1-title {
  font-size: 72px;
  font-weight: 800;
  line-height: 0.93;
  letter-spacing: -0.04em;
  margin-bottom: var(--sp-5);
}

.infographic-root .theme-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-top: 1px solid var(--rule);
}
.infographic-root .theme-item {
  padding: 18px 0;
  border-bottom: 1px solid var(--rule-fine);
  display: flex;
  gap: 14px;
  align-items: baseline;
}
.infographic-root .theme-item:nth-child(odd) {
  padding-right: 24px;
  border-right: 1px solid var(--rule-fine);
}
.infographic-root .theme-item:nth-child(even) {
  padding-left: 24px;
}
.infographic-root .theme-num {
  font-size: var(--text-xs);
  font-weight: 800;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.infographic-root .theme-name {
  font-size: var(--text-base);
  font-weight: 600;
}
.infographic-root .theme-desc {
  font-size: var(--text-sm);
  color: var(--muted);
  margin-top: 2px;
  line-height: 1.35;
}

/* Panel 3 — comparison bars */
.infographic-root .reliability-viz {
  display: flex;
  gap: 40px;
  padding: 32px 0;
}
.infographic-root .rel-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.infographic-root .rel-bar-container {
  width: 100%;
  height: 140px;
  display: flex;
  align-items: flex-end;
  background: rgba(16,16,16,0.03);
  border-radius: 3px;
  overflow: hidden;
}
.infographic-root .rel-bar {
  width: 100%;
  border-radius: 2px 2px 0 0;
  min-height: 4px;
}
.infographic-root .rel-meta {
  margin-top: 12px;
}
.infographic-root .rel-pct {
  font-size: var(--text-3xl);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}
.infographic-root .rel-label {
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--muted);
  margin-top: 4px;
}
.infographic-root .rel-sublabel {
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--muted);
  margin-top: 2px;
}

/* Panel 4 — MARE pills */
.infographic-root .mare-arch {
  display: flex;
  gap: 12px;
  align-items: center;
}
.infographic-root .mare-pill {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 14px;
  border: 1px solid var(--rule);
  border-radius: 3px;
}
.infographic-root .mare-connector {
  font-size: var(--text-sm);
  color: var(--muted);
}

/* Panel 6 — final CTA */
.infographic-root .final-cta {
  background: var(--ink);
  color: #fff;
  border-radius: 4px;
  padding: 32px 36px;
}
.infographic-root .final-cta .section-label { color: rgba(255,255,255,0.35); }
.infographic-root .final-cta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
.infographic-root .final-cta-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  font-size: var(--text-base);
  font-weight: 500;
  color: rgba(255,255,255,0.8);
}
.infographic-root .final-cta-item:nth-child(odd) {
  padding-right: 20px;
  border-right: 1px solid rgba(255,255,255,0.08);
}
.infographic-root .final-cta-item:nth-child(even) {
  padding-left: 20px;
}
.infographic-root .final-cta-item .cta-arrow {
  color: var(--accent);
}

/* ============================================================
   NEWSLETTER STICKY BANNER (website only, outside panels)
   ============================================================ */
.newsletter-sticky {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #101010;
  color: #fff;
  font-family: 'Inter Tight', -apple-system, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 24px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.01em;
  -webkit-font-smoothing: antialiased;
}
.newsletter-sticky a {
  color: #FA5D29;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;
}
.newsletter-sticky a:hover { opacity: 0.85; }
.newsletter-sticky .dismiss-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 18px;
  cursor: pointer;
  padding: 0 0 0 16px;
  line-height: 1;
  transition: color 0.2s;
}
.newsletter-sticky .dismiss-btn:hover { color: #fff; }
      `}</style>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500&display=swap"
        rel="stylesheet"
      />

      {/* UTM tracking pixel (fires once on load with campaign params) */}
      {(utmSource || utmMedium || utmCampaign) && (
        <img
          src={`/api/track?utm_source=${encodeURIComponent(utmSource)}&utm_medium=${encodeURIComponent(utmMedium)}&utm_campaign=${encodeURIComponent(utmCampaign)}&page=agentic-evals`}
          alt=""
          width={1}
          height={1}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />
      )}

      <div className="infographic-root">
        <div className="carousel-wrapper">
          <div className="carousel" ref={carouselRef}>

            {/* ============================================================
                PANEL 1 — TITLE
                ============================================================ */}
            <div className="panel" data-panel="1">
              <div className="panel-inner">
                <div className="eyebrow">Research Summary / March 2026</div>
                <div className="panel-num">01</div>

                <div className="gap-md"></div>

                <h1 className="panel-1-title">The State of<br />Agentic AI<br />Evaluation</h1>

                <p className="lead">Key findings from the Hugging Face Agentic Evals Workshop. Five speakers, five perspectives on why evaluation must evolve. From eval transparency to reliability gaps to dynamic benchmarks &mdash; this is what the community found.</p>

                <div className="gap-lg"></div>
                <div className="rule"></div>

                <div className="theme-list">
                  <div className="theme-item">
                    <span className="theme-num">01</span>
                    <div>
                      <div className="theme-name">Eval Transparency</div>
                      <div className="theme-desc">What&apos;s hidden in the fine print</div>
                    </div>
                  </div>
                  <div className="theme-item">
                    <span className="theme-num">02</span>
                    <div>
                      <div className="theme-name">The Reliability Gap</div>
                      <div className="theme-desc">Why capability benchmarks miss the point</div>
                    </div>
                  </div>
                  <div className="theme-item">
                    <span className="theme-num">03</span>
                    <div>
                      <div className="theme-name">Dynamic Benchmarks</div>
                      <div className="theme-desc">Testing agents in changing environments</div>
                    </div>
                  </div>
                  <div className="theme-item">
                    <span className="theme-num">04</span>
                    <div>
                      <div className="theme-name">Environment Design</div>
                      <div className="theme-desc">Sandbox-first evaluation methodology</div>
                    </div>
                  </div>
                  <div className="theme-item">
                    <span className="theme-num">05</span>
                    <div>
                      <div className="theme-name">Community Standards</div>
                      <div className="theme-desc">Open, decentralized, reproducible evals</div>
                    </div>
                  </div>
                  <div className="theme-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--muted)' }}>10 panels total</span>
                  </div>
                </div>

                <div className="spacer"></div>

                <div className="speakers-strip">
                  <div className="speaker-cell">
                    <div className="speaker-name">Abijit Kosh</div>
                    <div className="speaker-org">HF / Eval Coalition</div>
                  </div>
                  <div className="speaker-cell">
                    <div className="speaker-name">Arvind Narayanan</div>
                    <div className="speaker-org">Princeton University</div>
                  </div>
                  <div className="speaker-cell">
                    <div className="speaker-name">Pierre-Andr&eacute;</div>
                    <div className="speaker-org">Meta / ICLR 2026</div>
                  </div>
                  <div className="speaker-cell">
                    <div className="speaker-name">Mahesh</div>
                    <div className="speaker-org">Bespoke Labs</div>
                  </div>
                  <div className="speaker-cell">
                    <div className="speaker-name">Nathan</div>
                    <div className="speaker-org">HF / Open LLM Leaderboard</div>
                  </div>
                </div>
              </div>

              <div className="panel-footer">
                <span>Hugging Face Agentic Evals Workshop</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>01 / 10</span>
              </div>
            </div>

            {/* ============================================================
                PANEL 2 — THE EVAL CRISIS: REPORTING PROBLEMS
                ============================================================ */}
            <div className="panel" data-panel="2">
              <div className="panel-inner">
                <div className="eyebrow">Speaker 1 / Abijit Kosh, Hugging Face</div>
                <div className="panel-num">02</div>

                <h2>The Eval Crisis:<br />Reporting Problems</h2>

                <p className="lead">Evaluation nuances are hidden in the fine print. Model developers are becoming less transparent, not more.</p>

                <div className="gap-md"></div>

                <div className="stat-strip">
                  <div className="stat-cell">
                    <div className="stat-val">40<span className="unit"> / 237</span></div>
                    <div className="stat-desc">Problems omitted from OpenAI&apos;s SWE-bench score (tiny fine print)</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-val" style={{ color: 'var(--accent)' }}>&lt;15%</div>
                    <div className="stat-desc">Of model releases mention labor or environmental costs</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-val">2022</div>
                    <div className="stat-desc">Transparency declining since then</div>
                  </div>
                </div>

                <div className="gap-md"></div>
                <div className="section-label">Specific Failures</div>

                <div className="two-col">
                  <div className="col-item">
                    <div className="item-title">OpenAI GPT-5.2</div>
                    <div className="item-desc">Reported high SWE score but omitted 40 of 237 problems in tiny fine print. Criticized by Anthropic and eval researchers.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Meta Llama 4</div>
                    <div className="item-desc">Used different model versions to score different benchmarks. Benchmark maxing.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Chart manipulation</div>
                    <div className="item-desc">69.1 and 30.8 displayed as similarly tall histograms. Unscaled axes and missing error bars.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Declining teams</div>
                    <div className="item-desc">Companies have broken up or reassigned teams dedicated to documentation and social impact evaluation.</div>
                  </div>
                </div>

                <div className="gap-md"></div>
                <div className="callout">
                  <p>Positive signal: third-party evaluations are increasing in both quality and quantity.</p>
                </div>

                <div className="spacer"></div>
              </div>

              <div className="panel-footer">
                <span>Source: Abijit Kosh, Hugging Face / Eval Coalition</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>02 / 10</span>
              </div>
            </div>

            {/* ============================================================
                PANEL 3 — WHAT'S MISSING + SOLUTIONS
                ============================================================ */}
            <div className="panel" data-panel="3">
              <div className="panel-inner">
                <div className="eyebrow">Speaker 1 / Continued</div>
                <div className="panel-num">03</div>

                <h2>What&rsquo;s Missing<br />+ Solutions</h2>

                <div className="gap-sm"></div>
                <div className="section-label">6 Gaps in Agent Evals</div>

                <div className="two-col">
                  <div className="col-item">
                    <div className="item-title">Session-level data</div>
                    <div className="item-desc">Identical scores can mask completely different agent behavior</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Agent identity</div>
                    <div className="item-desc">Model is not the agent: sub-agents, MCP servers, memory config matter</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Robustness standards</div>
                    <div className="item-desc">No norms for seeds, prompt perturbations, or pass@K</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Cost reporting</div>
                    <div className="item-desc">Inconsistent or entirely absent across benchmarks</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Generalist compatibility</div>
                    <div className="item-desc">Benchmark protocols block generalist agents</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Human interaction</div>
                    <div className="item-desc">Human-agent collaboration remains undermeasured</div>
                  </div>
                </div>

                <div className="gap-md"></div>
                <div className="section-label">Every Eval Ever Project</div>
                <p className="body-text">A unified open data format collecting ALL first and third-party evaluations on Hugging Face. Schema requires: source provenance, model specification (quantization, version), evaluation library, instance-level results. Goal: &ldquo;Eval Cards&rdquo; &mdash; visit a website, click any model, see all organized evaluations in one place.</p>

                <div className="gap-md"></div>
                <div className="section-label">Proposed Agentic Extensions</div>

                <div className="num-item"><div className="num-idx">01</div><div className="num-body"><div className="num-title">System Composition</div><div className="num-desc">Models inside the system, their roles, sub-agents, MCP servers</div></div></div>
                <div className="num-item"><div className="num-idx">02</div><div className="num-body"><div className="num-title">Session Semantics</div><div className="num-desc">Fields defining what constitutes a particular run or session</div></div></div>
                <div className="num-item"><div className="num-idx">03</div><div className="num-body"><div className="num-title">Interaction Accounting</div><div className="num-desc">Measurements of every interaction in the agent workflow</div></div></div>
                <div className="num-item"><div className="num-idx">04</div><div className="num-body"><div className="num-title">Eval Conditions</div><div className="num-desc">Conditions needed to reproduce an agent action by a third party</div></div></div>

                <div className="gap-md"></div>
                <div className="section-label">Policy Implications</div>
                <div className="callout">
                  <p>Governance requires session data. Just giving a score is not enough to audit agent behavior. White-box system records are needed to identify which actor was responsible for a harm.</p>
                </div>

                <div className="spacer"></div>
              </div>

              <div className="panel-footer">
                <span>Source: Abijit Kosh, Hugging Face / Eval Coalition</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>03 / 10</span>
              </div>
            </div>

            {/* ============================================================
                PANEL 4 — CAPABILITY != RELIABILITY
                ============================================================ */}
            <div className="panel" data-panel="4">
              <div className="panel-inner">
                <div className="eyebrow">Speaker 2 / Arvind Narayanan, Princeton</div>
                <div className="panel-num">04</div>

                <h2>Capability &ne;<br />Reliability</h2>

                <p className="lead">AI agents crush capability benchmarks. Yet there is no measurable GDP impact. What&rsquo;s going on?</p>

                <div className="gap-md"></div>
                <div className="section-label">Real-World Reliability Failures</div>

                <div className="two-col">
                  <div className="col-item">
                    <div className="item-title">Rabbit R1</div>
                    <div className="item-desc">Delivered food to the wrong address. With pre-LLM systems like Alexa, playing the wrong song is an annoyance. With agents using your credit card, 10% failure rate is dead on arrival.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">OpenAI Operator</div>
                    <div className="item-desc">Incorrect online purchases.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Agentic coding</div>
                    <div className="item-desc">A coding agent deleted a production database.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Governments</div>
                    <div className="item-desc">Even governments, usually slow to adopt, are not immune from reliability failures.</div>
                  </div>
                </div>

                <div className="gap-md"></div>
                <div className="callout">
                  <p>Ever since the Wright brothers, we&rsquo;ve demonstrated planes can fly. Getting to one error per trillion miles took most of a century. AI agent reliability may face a similar timeline.</p>
                </div>

                <div className="gap-md"></div>
                <div className="section-label">Over 18 Months / 14 Frontier Models</div>

                <div className="reliability-viz">
                  <div className="rel-col">
                    <div className="rel-bar-container">
                      <div className="rel-bar" style={{ height: '85%', background: 'var(--ink)' }}></div>
                    </div>
                    <div className="rel-meta">
                      <div className="rel-pct">~85%</div>
                      <div className="rel-label">Capability</div>
                      <div className="rel-sublabel">Can it do the task at all?</div>
                    </div>
                  </div>
                  <div className="rel-col">
                    <div className="rel-bar-container">
                      <div className="rel-bar" style={{ height: '32%', background: 'var(--accent)' }}></div>
                    </div>
                    <div className="rel-meta">
                      <div className="rel-pct" style={{ color: 'var(--accent)' }}>~32%</div>
                      <div className="rel-label">Reliability</div>
                      <div className="rel-sublabel">Does it do it consistently?</div>
                    </div>
                  </div>
                </div>

                <div className="spacer"></div>
              </div>

              <div className="panel-footer">
                <span>Source: Arvind Narayanan, Princeton University</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>04 / 10</span>
              </div>
            </div>

            {/* ============================================================
                PANEL 5 — RELIABILITY: DEEP DIVE
                ============================================================ */}
            <div className="panel" data-panel="5">
              <div className="panel-inner">
                <div className="eyebrow">Speaker 2 / Continued</div>
                <div className="panel-num">05</div>

                <h2>Reliability:<br />Deep Dive</h2>

                <div className="gap-md"></div>
                <div className="section-label">4 Dimensions, 12 Metrics</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 40px' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>Consistency</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.7 }}>
                      1a. <strong style={{ color: 'var(--ink)' }}>Outcome</strong> &mdash; same pass/fail each run?<br />
                      1b. <strong style={{ color: 'var(--ink)' }}>Trajectory</strong> &mdash; same action sequence?<br />
                      1c. <strong style={{ color: 'var(--ink)' }}>Cost</strong> &mdash; stable resource usage?
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>Robustness</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.7 }}>
                      2a. <strong style={{ color: 'var(--ink)' }}>Fault</strong> &mdash; inject API timeouts, errors<br />
                      2b. <strong style={{ color: 'var(--ink)' }}>Prompt</strong> &mdash; reworded input, same answer?
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>Calibration</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.7 }}>
                      3a. <strong style={{ color: 'var(--ink)' }}>Calibration</strong> &mdash; confidence vs reality. Improving.<br />
                      3b. <strong style={{ color: 'var(--ink)' }}>Discrimination</strong> &mdash; separate wins from losses? <span style={{ color: 'var(--accent)' }}>Getting worse.</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>Failure Severity</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.7 }}>
                      4a. <strong style={{ color: 'var(--ink)' }}>Severity</strong> &mdash; formatting errors vs data deletion, wrong purchases. Measured separately.
                    </div>
                  </div>
                </div>

                <div className="gap-md"></div>
                <div className="section-label">Trace Analysis Insights</div>

                <div className="x-item"><span className="x-mark">&bull;</span><span className="x-text">Models confuse clean process with correct answer &mdash; messy tool-calling creates false underconfidence</span></div>
                <div className="x-item"><span className="x-mark">&bull;</span><span className="x-text">Ambiguous questions are valuable &mdash; real tasks are always ambiguous</span></div>
                <div className="x-item"><span className="x-mark">&bull;</span><span className="x-text">Hallucinations spike when faults are injected &mdash; model fabricates instead of failing</span></div>

                <div className="gap-sm"></div>
                <div className="callout">
                  <p>When benchmarks &ldquo;saturate,&rdquo; maybe it&rsquo;s the metric that&rsquo;s saturated, not the task suite. Planning a Reliability Index to track all 12 metrics over time.</p>
                </div>

                <div className="spacer"></div>
              </div>

              <div className="panel-footer">
                <span>Source: Arvind Narayanan, Princeton University</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>05 / 10</span>
              </div>
            </div>

            {/* ============================================================
                PANEL 6 — GAIA 2: THE BENCHMARK
                ============================================================ */}
            <div className="panel" data-panel="6">
              <div className="panel-inner">
                <div className="eyebrow">Speaker 3 / Pierre-Andr&eacute;, Meta</div>
                <div className="panel-num">06</div>

                <h2>GAIA 2:<br />The Benchmark</h2>

                <p className="lead">Real agents work in a changing world. Emails arrive, prices shift, meetings get cancelled. GAIA 2 simulates interconnected apps where the world changes during the task.</p>

                <div className="gap-md"></div>
                <div className="section-label">Why Simulation?</div>

                <div className="num-item"><div className="num-idx">01</div><div className="num-body"><div className="num-title">Reproducible</div><div className="num-desc">Observable evaluation, test robustness reliably</div></div></div>
                <div className="num-item"><div className="num-idx">02</div><div className="num-body"><div className="num-title">Safe</div><div className="num-desc">Test destructive actions (delete emails, cancel events) without risk</div></div></div>
                <div className="num-item"><div className="num-idx">03</div><div className="num-body"><div className="num-title">Cheap</div><div className="num-desc">No external API dependencies, no bandwidth costs</div></div></div>
                <div className="num-item"><div className="num-idx">04</div><div className="num-body"><div className="num-title">Controllable</div><div className="num-desc">Inject faults, vary API signatures, add noise at will</div></div></div>

                <div className="gap-md"></div>

                <div className="stat-strip">
                  <div className="stat-cell">
                    <div className="stat-val">1,000</div>
                    <div className="stat-desc">Scenarios</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-val">10</div>
                    <div className="stat-desc">Universes</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-val">11</div>
                    <div className="stat-desc">Apps per universe</div>
                  </div>
                </div>

                <div className="gap-md"></div>
                <div className="section-label">Built on MARE Framework</div>
                <div className="mare-arch">
                  <span className="mare-pill">Apps</span>
                  <span className="mare-connector">&rarr;</span>
                  <span className="mare-pill">Universes</span>
                  <span className="mare-connector">&rarr;</span>
                  <span className="mare-pill">Events</span>
                  <span className="mare-connector">&rarr;</span>
                  <span className="mare-pill">Scenarios</span>
                </div>

                <div className="gap-sm"></div>

                <div className="two-col">
                  <div className="col-item">
                    <div className="item-title">Apps</div>
                    <div className="item-desc">Stateful services (email, messenger, calendar, files) with API, MCP, and CLI access</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Universes</div>
                    <div className="item-desc">Simulated environments with auto-generated personas, past emails, calendar events, message history</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Events</div>
                    <div className="item-desc">Injected from user, agent, or environment mid-task</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Scenarios</div>
                    <div className="item-desc">Task prompt + expected event sequence + environment changes during task</div>
                  </div>
                </div>

                <div className="spacer"></div>
              </div>

              <div className="panel-footer">
                <span>Source: Pierre-Andr&eacute;, Meta &mdash; ICLR 2026</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>06 / 10</span>
              </div>
            </div>

            {/* ============================================================
                PANEL 7 — GAIA 2: RESULTS & VERIFICATION
                ============================================================ */}
            <div className="panel" data-panel="7">
              <div className="panel-inner">
                <div className="eyebrow">Speaker 3 / Continued</div>
                <div className="panel-num">07</div>

                <h2>GAIA 2: Results<br />&amp; Verification</h2>

                <div className="gap-sm"></div>
                <div className="section-label">5 Capability Dimensions</div>

                <div className="dim-row">
                  <div className="dim-name">Execution</div>
                  <div className="dim-bar-track"><div className="dim-bar-fill" style={{ width: '75%', background: 'var(--ink)' }}></div></div>
                  <div className="dim-val">~75%</div>
                </div>
                <div className="dim-row">
                  <div className="dim-name">Search</div>
                  <div className="dim-bar-track"><div className="dim-bar-fill" style={{ width: '68%', background: 'var(--ink)' }}></div></div>
                  <div className="dim-val">~68%</div>
                </div>
                <div className="dim-row">
                  <div className="dim-name">Adaptability</div>
                  <div className="dim-bar-track"><div className="dim-bar-fill" style={{ width: '25%', background: 'rgba(16,16,16,0.25)' }}></div></div>
                  <div className="dim-val poor">~25%</div>
                </div>
                <div className="dim-row">
                  <div className="dim-name">Time</div>
                  <div className="dim-bar-track"><div className="dim-bar-fill" style={{ width: '3%', background: 'var(--accent)' }}></div></div>
                  <div className="dim-val fail">~0%</div>
                </div>
                <div className="dim-row">
                  <div className="dim-name">Ambiguity</div>
                  <div className="dim-bar-track"><div className="dim-bar-fill" style={{ width: '22%', background: 'rgba(16,16,16,0.25)' }}></div></div>
                  <div className="dim-val poor">~22%</div>
                </div>

                <div className="gap-sm"></div>

                <div className="two-col">
                  <div className="col-item">
                    <div className="item-title">Execution</div>
                    <div className="item-desc">Multi-tool tasks in one turn. Cancel meetings, respond to emails.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Search</div>
                    <div className="item-desc">Find information across apps. &ldquo;Find my Netflix password &mdash; I shared it with my parents.&rdquo; Agent must figure out who your parents are, search communication apps.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Adaptability</div>
                    <div className="item-desc">Multi-turn. Environment disrupts mid-task. Agent booked meetings but attendees cancel &mdash; must react and reschedule.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Time</div>
                    <div className="item-desc">React to time-based events. Book a flight when the price drops. Simulation fast-forwards weeks so you don&rsquo;t wait.</div>
                  </div>
                </div>

                <div className="gap-xs"></div>
                <p className="body-text" style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}><strong>Ambiguity:</strong> Agent must recognize when to stop and ask clarifying questions before acting.</p>

                <div className="gap-sm"></div>

                <div className="warning-block">
                  <p><span className="highlight">Time-based tasks:</span> near zero percent success across all frontier models.</p>
                </div>

                <div className="gap-md"></div>
                <div className="section-label">Verification Approach</div>

                <div className="two-col">
                  <div className="col-item">
                    <div className="item-title">Hard Verifiers</div>
                    <div className="item-desc">Compare expected DAG of actions vs actual DAG. Event-by-event: correct order, parameters, recipients, timing. Pure equality or simple algorithmic checks. Cheap, reliable, reproducible.</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Soft Verifiers</div>
                    <div className="item-desc">LLM-as-judge for generated content (e.g., does the email body match the expected intent?). Used only where hard verification isn&rsquo;t possible.</div>
                  </div>
                </div>

                <div className="gap-sm"></div>
                <div className="callout">
                  <p>Moved away from rubric-based judging &mdash; too expensive and too dependent on LLM capability. Hard verifiers are the default.</p>
                </div>

                <div className="gap-sm"></div>
                <div className="section-label">Robustness Testing</div>
                <div className="tag-row">
                  <span className="tag">Tool failure injection</span>
                  <span className="tag">API signature variation</span>
                  <span className="tag">Environment noise</span>
                  <span className="tag">Agent-to-agent delegation</span>
                </div>

                <div className="spacer"></div>
              </div>

              <div className="panel-footer">
                <span>Source: Pierre-Andr&eacute;, Meta &mdash; ICLR 2026</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>07 / 10</span>
              </div>
            </div>

            {/* ============================================================
                PANEL 8 — HOW TO EVALUATE: METHODOLOGY
                ============================================================ */}
            <div className="panel" data-panel="8">
              <div className="panel-inner">
                <div className="eyebrow">Speaker 4 / Mahesh, Bespoke Labs</div>
                <div className="panel-num">08</div>

                <h2>How to Evaluate:<br />Methodology</h2>

                <p className="lead">Like Hiccup in How to Train Your Dragon &mdash; the real transition happens when you start to observe and truly understand your agent before trying to train it.</p>

                <div className="gap-md"></div>
                <div className="section-label">Common Mistakes</div>

                <div className="x-item"><span className="x-mark">&times;</span><span className="x-text">Checking only the final output &mdash; breaks when anything changes</span></div>
                <div className="x-item"><span className="x-mark">&times;</span><span className="x-text">Starting with granular function call details too early</span></div>
                <div className="x-item"><span className="x-mark">&times;</span><span className="x-text">Deploying to production and evaluating there</span></div>

                <div className="gap-md"></div>
                <div className="section-label">Why Agent Evals Are Hard</div>

                <div className="two-col">
                  <div className="col-item">
                    <div className="item-title">Stochastic</div>
                    <div className="item-desc">Two identical runs can produce completely different results</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Multi-step</div>
                    <div className="item-desc">Many actions to reach the final outcome, each introducing complexity</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">World-changing</div>
                    <div className="item-desc">Agent actions alter the environment, making evals non-reproducible</div>
                  </div>
                  <div className="col-item">
                    <div className="item-title">Expensive</div>
                    <div className="item-desc">Real-world interactions cost money and risk destructive actions</div>
                  </div>
                </div>

                <div className="gap-md"></div>
                <div className="section-label">Two Levels of Evaluation</div>

                <div className="num-item"><div className="num-idx">01</div><div className="num-body"><div className="num-title">Verifiable outputs</div><div className="num-desc">Did the unit tests pass? Is the math correct? Is the bug fixed? Gotcha: don&rsquo;t weight all tests equally &mdash; many simple tests can mask important failures. Watch for reward hacking: the agent fixes the test instead of the bug.</div></div></div>
                <div className="num-item"><div className="num-idx">02</div><div className="num-body"><div className="num-title">Non-verifiable outputs</div><div className="num-desc">For tasks like deep research where there&rsquo;s no single right answer. Define rubrics with weighted dimensions scored 0&ndash;1. Use LLM-as-judge. Get a composite score you can track over time.</div></div></div>

                <div className="spacer"></div>
              </div>

              <div className="panel-footer">
                <span>Source: Mahesh, Bespoke Labs</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>08 / 10</span>
              </div>
            </div>

            {/* ============================================================
                PANEL 9 — HOW TO EVALUATE: THE STACK
                ============================================================ */}
            <div className="panel" data-panel="9">
              <div className="panel-inner">
                <div className="eyebrow">Speaker 4 / Continued</div>
                <div className="panel-num">09</div>

                <h2>How to Evaluate:<br />The Stack</h2>

                <div className="gap-sm"></div>
                <div className="section-label">The Environment Model</div>
                <p className="body-text">Environment = Sandbox containing dependencies, state of the world, tools, and data. Formats: Docker/Harbor, OpenEnd.</p>

                <div className="gap-md"></div>
                <div className="section-label">Critical Design Rules</div>

                <div className="x-item"><span className="x-mark">&bull;</span><span className="x-text">Environment must mirror production as closely as possible</span></div>
                <div className="x-item"><span className="x-mark">&bull;</span><span className="x-text">Agent must NEVER have access to the grader or solution (prevents reward hacking)</span></div>
                <div className="x-item"><span className="x-mark">&bull;</span><span className="x-text">Grade ALL requested outcomes &mdash; if you grade 2 of 3 things, the agent ignores the third</span></div>
                <div className="x-item"><span className="x-mark">&bull;</span><span className="x-text">Add fingerprints to unit tests to prevent agent manipulation</span></div>
                <div className="x-item"><span className="x-mark">&bull;</span><span className="x-text">Same model on different harnesses gives drastically different results (visible on Terminal Bench dashboard)</span></div>

                <div className="gap-sm"></div>
                <div className="section-label">The 6-Step Evaluation Stack</div>

                <div className="num-item"><div className="num-idx">01</div><div className="num-body"><div className="num-title">Build sandbox environment</div><div className="num-desc">Mirror production with Docker, Harbor, or OpenEnd</div></div></div>
                <div className="num-item"><div className="num-idx">02</div><div className="num-body"><div className="num-title">Define representative tasks</div><div className="num-desc">Reflective of real workloads, varying difficulty</div></div></div>
                <div className="num-item"><div className="num-idx">03</div><div className="num-body"><div className="num-title">Set up graders</div><div className="num-desc">Hard verifiers where possible, rubrics for open-ended</div></div></div>
                <div className="num-item"><div className="num-idx">04</div><div className="num-body"><div className="num-title">Measure success rate / pass@K</div><div className="num-desc">N rollouts, compare across models and harnesses</div></div></div>
                <div className="num-item"><div className="num-idx">05</div><div className="num-body"><div className="num-title">Analyze traces</div><div className="num-desc">Automated failure analysis for hidden patterns</div></div></div>
                <div className="num-item"><div className="num-idx">06</div><div className="num-body"><div className="num-title">Document everything</div><div className="num-desc">System composition, session semantics, eval conditions</div></div></div>

                <div className="gap-sm"></div>
                <div className="section-label">Metrics</div>

                <div className="metric-group" style={{ marginBottom: '16px' }}>
                  <span className="metric-pill primary">Success Rate</span>
                  <span className="metric-pill primary">Pass@K</span>
                  <span className="metric-pill">Steps</span>
                  <span className="metric-pill">Tokens</span>
                  <span className="metric-pill">Latency</span>
                  <span className="metric-pill">Cost</span>
                  <span className="metric-pill">Safety</span>
                </div>

                <div className="callout">
                  <p>Once environment, tasks, and graders are solid, run RL algorithms like GRPO to optimize. Measure improvements, then deploy.</p>
                </div>

                <div className="spacer"></div>
              </div>

              <div className="panel-footer">
                <span>Source: Mahesh, Bespoke Labs</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>09 / 10</span>
              </div>
            </div>

            {/* ============================================================
                PANEL 10 — COMMUNITY EVALS + CALL TO ACTION
                ============================================================ */}
            <div className="panel" data-panel="10">
              <div className="panel-inner">
                <div className="eyebrow">Speaker 5 / Nathan, Hugging Face</div>
                <div className="panel-num">10</div>

                <h2>Community Evals<br />+ Call to Action</h2>

                <div className="gap-sm"></div>
                <div className="section-label">Community Evals on the Hub</div>

                <div className="chk-item"><span className="chk-dot"></span><span className="chk-text">Anyone can contribute &mdash; decentralized evaluation at scale</span></div>
                <div className="chk-item"><span className="chk-dot"></span><span className="chk-text">eval.yaml defines: benchmark name, evaluation framework (e.g., Inspect AI), tasks, solvers (how to prompt the model), scorer (how to grade the answer)</span></div>
                <div className="chk-item"><span className="chk-dot"></span><span className="chk-text">One command to run: use Inspect AI with HF dataset references</span></div>
                <div className="chk-item"><span className="chk-dot"></span><span className="chk-text">Results as PRs on model repos &mdash; community discusses, model authors can hide disputed scores</span></div>
                <div className="chk-item"><span className="chk-dot"></span><span className="chk-text">13+ benchmarks live: SWE-Bench, Terminal Bench, HLE, AM 2026, and more</span></div>

                <div className="gap-sm"></div>

                <div className="warning-block">
                  <p><span className="highlight">Never evaluate via inference providers.</span> You evaluate the provider&rsquo;s configuration, not the model itself.</p>
                </div>

                <div className="gap-sm"></div>
                <div className="section-label">Open Challenges</div>

                <div className="status-row"><span className="label">Long horizon evaluation</span><span className="badge critical">Unsolved</span></div>
                <div className="status-row"><span className="label">Multi-agent evaluation</span><span className="badge neutral">Early stage</span></div>
                <div className="status-row"><span className="label">Sim-to-real gap</span><span className="badge neutral">Active research</span></div>
                <div className="status-row"><span className="label">Benchmark gaming</span><span className="badge neutral">Needs standards</span></div>
                <div className="status-row"><span className="label">Reliability optimization</span><span className="badge critical">Not guaranteed</span></div>

                <div className="gap-md"></div>

                <div className="final-cta">
                  <div className="section-label">The Call to Action</div>
                  <div className="gap-xs"></div>
                  <div className="final-cta-grid">
                    <div className="final-cta-item"><span className="cta-arrow">&rarr;</span> Build evals in the open</div>
                    <div className="final-cta-item"><span className="cta-arrow">&rarr;</span> Use open reporting frameworks</div>
                    <div className="final-cta-item"><span className="cta-arrow">&rarr;</span> Stop benchmark chasing</div>
                    <div className="final-cta-item"><span className="cta-arrow">&rarr;</span> Measure reliability, not just capability</div>
                    <div className="final-cta-item"><span className="cta-arrow">&rarr;</span> Invest in scalable oversight</div>
                    <div className="final-cta-item"><span className="cta-arrow">&rarr;</span> Keep humans in eval policy</div>
                  </div>
                </div>

                <div className="gap-sm"></div>
                <div className="callout">
                  <p>Whether a benchmark is public or private has no strong correlation with how quickly it saturates. The real challenge is multi-agent evaluation &mdash; adding more agents creates an explosion of parameters.</p>
                </div>

                <div className="spacer"></div>
              </div>

              <div className="panel-footer">
                <span>The State of Agentic AI Evaluation &mdash; Hugging Face Workshop 2026</span>
                <a href="/blog" className="brand"><img src="/research/logo.png" alt="MindPattern" /><span>mindpattern.ai</span></a>
                <span>10 / 10</span>
              </div>
            </div>

          </div>{/* /.carousel */}

          <div className="nav">
            <button className="nav-btn" onClick={() => scrollPanel(-1)} aria-label="Previous panel">&larr;</button>
            <div className="dots" ref={dotsRef}>
              {Array.from({ length: totalPanels }).map((_, i) => (
                <div
                  key={i}
                  className={`dot${i === currentIndex ? ' active' : ''}`}
                  onClick={() => scrollToPanel(i)}
                />
              ))}
            </div>
            <button className="nav-btn" onClick={() => scrollPanel(1)} aria-label="Next panel">&rarr;</button>
          </div>
          <div className="dl-btn-row">
            <button className="dl-btn" onClick={downloadAll} disabled={downloading}>
              {downloading ? 'Exporting...' : 'Download All PNGs'}
            </button>
            <a href="/research/agentic-evals/agentic-evals-infographic.pdf" className="pdf-link" download>
              Download as PDF
            </a>
          </div>
        </div>{/* /.carousel-wrapper */}
      </div>

      {/* Newsletter sticky banner — outside carousel, won't affect PNG exports */}
      <NewsletterBanner />
    </>
  )
}

function NewsletterBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="newsletter-sticky">
      <span>Check out MindPattern newsletters</span>
      <a href="https://mindpattern.ai/blog">&rarr;</a>
      <button className="dismiss-btn" onClick={() => setDismissed(true)} aria-label="Dismiss">&times;</button>
    </div>
  )
}
