'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { identityColor, isCanonicalTopic, topicColor } from '@/lib/topic-color'

export interface GraphNode {
  slug: string
  title: string
  section: string
  /** 0..1, by wire rank (1 = top story). Drives node size. */
  weight: number
  entities: string[]
  href: string
}

/** topicColor() slots resolved to real hexes for WebGL; neutral = ink. */
const VAR_HEX: Record<string, number> = {
  'var(--spectrum-1)': 0xe63b12,
  'var(--spectrum-2)': 0x0797a6,
  'var(--spectrum-3)': 0xcf2d7b,
  'var(--spectrum-4)': 0xf5c518,
  'var(--ink)': 0x0e0e0f,
}

const INK = 0x0e0e0f
const MAX_EDGES = 90
const EDGES_PER_NODE = 3

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Real relations: shared entity first, then shared section. */
function buildEdges(nodes: GraphNode[]): Array<[number, number]> {
  const edges: Array<[number, number]> = []
  const seen = new Set<string>()
  const degree = new Array<number>(nodes.length).fill(0)
  const add = (a: number, b: number) => {
    if (a === b || edges.length >= MAX_EDGES) return
    if (degree[a] >= EDGES_PER_NODE || degree[b] >= EDGES_PER_NODE) return
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (seen.has(key)) return
    seen.add(key)
    degree[a]++
    degree[b]++
    edges.push([a, b])
  }
  const byEntity = new Map<string, number[]>()
  nodes.forEach((n, i) => {
    for (const e of n.entities) {
      const list = byEntity.get(e) ?? []
      list.push(i)
      byEntity.set(e, list)
    }
  })
  for (const members of byEntity.values()) {
    for (let k = 0; k + 1 < members.length; k++) add(members[k], members[k + 1])
  }
  const bySection = new Map<string, number[]>()
  nodes.forEach((n, i) => {
    const list = bySection.get(n.section) ?? []
    list.push(i)
    bySection.set(n.section, list)
  })
  for (const members of bySection.values()) {
    for (let k = 0; k + 1 < members.length; k++) add(members[k], members[k + 1])
  }
  return edges
}

/**
 * A real force-directed graph of the wire (three.js): nodes repel, edges
 * spring, and you can grab a node, drag it around, and fling it — the rest
 * of the graph reacts. Hover grows a node, lights up its edges, and shows
 * the story title; a clean click (not a drag) opens the story. The layout
 * pre-settles synchronously so the first paint is complete even where rAF
 * never runs. Reduced motion: no idle drift, but hover/drag still respond.
 */
export function KnowledgeGraph({
  nodes,
  findingCount,
}: {
  nodes: GraphNode[]
  findingCount: number
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ x: number; y: number; title: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const host = hostRef.current
    if (!host || nodes.length === 0) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0xffffff, 0)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'pan-y' // vertical page scroll stays native
    host.appendChild(renderer.domElement)

    let w = host.clientWidth || 1
    let h = host.clientHeight || 1
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(0, w, h, 0, -100, 100)

    const rand = mulberry32(nodes.length * 2654435761 + 7)
    const n = nodes.length
    const px = new Float32Array(n)
    const py = new Float32Array(n)
    const vx = new Float32Array(n)
    const vy = new Float32Array(n)
    const radius = new Float32Array(n)

    const circleGeo = new THREE.CircleGeometry(1, 32)
    const ringGeo = new THREE.RingGeometry(1, 1.18, 32)
    const materials = new Map<number, THREE.MeshBasicMaterial>()
    const matFor = (hex: number) => {
      let m = materials.get(hex)
      if (!m) {
        m = new THREE.MeshBasicMaterial({ color: hex })
        materials.set(hex, m)
      }
      return m
    }

    const meshes: THREE.Mesh[] = []
    const rings: THREE.Mesh[] = []
    for (let i = 0; i < n; i++) {
      px[i] = (0.08 + 0.84 * rand()) * w
      py[i] = (0.18 + 0.64 * rand()) * h
      radius[i] = 4 + nodes[i].weight * 8
      const c = isCanonicalTopic(nodes[i].section)
        ? topicColor(nodes[i].section)
        : identityColor(nodes[i].slug)
      const hex = VAR_HEX[c.base] ?? INK
      const mesh = new THREE.Mesh(circleGeo, matFor(hex))
      mesh.renderOrder = 2
      scene.add(mesh)
      meshes.push(mesh)
      // hover ring, hidden until needed
      const ring = new THREE.Mesh(ringGeo, matFor(INK))
      ring.visible = false
      ring.renderOrder = 3
      scene.add(ring)
      rings.push(ring)
    }

    const edges = buildEdges(nodes)
    const linePos = new Float32Array(edges.length * 6)
    const lineGeo = new THREE.BufferGeometry()
    const lineAttr = new THREE.BufferAttribute(linePos, 3)
    lineAttr.setUsage(THREE.DynamicDrawUsage)
    lineGeo.setAttribute('position', lineAttr)
    const dimMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.12 })
    scene.add(new THREE.LineSegments(lineGeo, dimMat))
    // highlighted edges of the hovered/dragged node
    const hiPos = new Float32Array(edges.length * 6)
    const hiGeo = new THREE.BufferGeometry()
    const hiAttr = new THREE.BufferAttribute(hiPos, 3)
    hiAttr.setUsage(THREE.DynamicDrawUsage)
    hiGeo.setAttribute('position', hiAttr)
    hiGeo.setDrawRange(0, 0)
    const hiMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.55 })
    const hiLines = new THREE.LineSegments(hiGeo, hiMat)
    hiLines.renderOrder = 1
    scene.add(hiLines)

    let hovered = -1
    let dragged = -1

    const REST = 92
    const step = (idle: number) => {
      // pairwise repulsion
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          let dx = px[i] - px[j]
          let dy = py[i] - py[j]
          let d2 = dx * dx + dy * dy
          if (d2 < 1) d2 = 1
          const f = 2600 / d2
          const d = Math.sqrt(d2)
          dx /= d
          dy /= d
          vx[i] += dx * f
          vy[i] += dy * f
          vx[j] -= dx * f
          vy[j] -= dy * f
        }
      }
      // springs along real relations
      for (const [a, b] of edges) {
        const dx = px[b] - px[a]
        const dy = py[b] - py[a]
        const d = Math.max(Math.hypot(dx, dy), 1)
        const f = (d - REST) * 0.02
        vx[a] += (dx / d) * f
        vy[a] += (dy / d) * f
        vx[b] -= (dx / d) * f
        vy[b] -= (dy / d) * f
      }
      // gentle pull toward the band + idle breathing
      for (let i = 0; i < n; i++) {
        vx[i] += (w * 0.5 - px[i]) * 0.0008
        vy[i] += (h * 0.52 - py[i]) * 0.002
        if (idle > 0) {
          vx[i] += (rand() - 0.5) * idle
          vy[i] += (rand() - 0.5) * idle
        }
        if (i === dragged) {
          vx[i] = 0
          vy[i] = 0
          continue
        }
        vx[i] *= 0.86
        vy[i] *= 0.86
        px[i] += vx[i]
        py[i] += vy[i]
        const pad = radius[i] + 10
        px[i] = Math.min(w - pad, Math.max(pad, px[i]))
        py[i] = Math.min(h - pad, Math.max(pad, py[i]))
      }
    }

    const draw = () => {
      for (let i = 0; i < n; i++) {
        const grow = i === hovered || i === dragged ? 1.35 : 1
        meshes[i].scale.setScalar(radius[i] * grow)
        meshes[i].position.set(px[i], h - py[i], 0)
        rings[i].visible = i === hovered || i === dragged
        if (rings[i].visible) {
          rings[i].scale.setScalar(radius[i] * grow + 3.5)
          rings[i].position.set(px[i], h - py[i], 1)
        }
      }
      let hi = 0
      for (let e = 0; e < edges.length; e++) {
        const [a, b] = edges[e]
        linePos[e * 6] = px[a]
        linePos[e * 6 + 1] = h - py[a]
        linePos[e * 6 + 2] = -1
        linePos[e * 6 + 3] = px[b]
        linePos[e * 6 + 4] = h - py[b]
        linePos[e * 6 + 5] = -1
        if (a === hovered || b === hovered || a === dragged || b === dragged) {
          hiPos.set(linePos.subarray(e * 6, e * 6 + 6), hi * 6)
          hi++
        }
      }
      hiGeo.setDrawRange(0, hi * 2)
      lineAttr.needsUpdate = true
      hiAttr.needsUpdate = true
      renderer.render(scene, camera)
    }

    // pre-settle synchronously: the first paint is a finished layout
    for (let k = 0; k < 160; k++) step(0)

    const nodeAt = (cx: number, cy: number) => {
      const rect = host.getBoundingClientRect()
      const x = cx - rect.left
      const y = cy - rect.top
      for (let i = 0; i < n; i++) {
        const dx = px[i] - x
        const dy = py[i] - y
        const hit = radius[i] + 6
        if (dx * dx + dy * dy <= hit * hit) return i
      }
      return -1
    }

    let downAt: { x: number; y: number; t: number } | null = null
    let lastMove = { x: 0, y: 0 }
    const toLocal = (ev: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      return { x: ev.clientX - rect.left, y: ev.clientY - rect.top }
    }
    const onDown = (ev: PointerEvent) => {
      const i = nodeAt(ev.clientX, ev.clientY)
      if (i < 0) return
      dragged = i
      downAt = { x: ev.clientX, y: ev.clientY, t: performance.now() }
      lastMove = toLocal(ev)
      host.setPointerCapture?.(ev.pointerId)
      host.style.cursor = 'grabbing'
      ev.preventDefault()
    }
    const onMove = (ev: PointerEvent) => {
      const p = toLocal(ev)
      if (dragged >= 0) {
        vx[dragged] = (p.x - lastMove.x) * 0.6
        vy[dragged] = (p.y - lastMove.y) * 0.6
        px[dragged] = p.x
        py[dragged] = p.y
        lastMove = p
        setTip({ x: p.x, y: p.y, title: nodes[dragged].title })
        return
      }
      const i = nodeAt(ev.clientX, ev.clientY)
      if (i !== hovered) {
        hovered = i
        host.style.cursor = i >= 0 ? 'grab' : 'default'
        setTip(i >= 0 ? { x: p.x, y: p.y, title: nodes[i].title } : null)
      } else if (i >= 0) {
        setTip({ x: p.x, y: p.y, title: nodes[i].title })
      }
    }
    const onUp = (ev: PointerEvent) => {
      if (dragged >= 0 && downAt) {
        const dist = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y)
        const dt = performance.now() - downAt.t
        const i = dragged
        dragged = -1
        host.style.cursor = 'grab'
        if (dist < 5 && dt < 350) router.push(nodes[i].href) // a click, not a drag
      }
      downAt = null
    }
    const onLeave = () => {
      hovered = -1
      dragged = -1
      setTip(null)
      host.style.cursor = 'default'
    }
    host.addEventListener('pointerdown', onDown)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerup', onUp)
    host.addEventListener('pointerleave', onLeave)

    const applySize = () => {
      w = host.clientWidth || 1
      h = host.clientHeight || 1
      camera.right = w
      camera.top = h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      for (let k = 0; k < 30; k++) step(0)
      draw()
    }
    applySize()
    const ro = new ResizeObserver(applySize)
    ro.observe(host)

    let raf = 0
    const loop = () => {
      step(reduced ? 0 : 0.16)
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('pointerdown', onDown)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerup', onUp)
      host.removeEventListener('pointerleave', onLeave)
      circleGeo.dispose()
      ringGeo.dispose()
      lineGeo.dispose()
      hiGeo.dispose()
      dimMat.dispose()
      hiMat.dispose()
      for (const m of materials.values()) m.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    }
  }, [nodes, router])

  return (
    <div
      role="img"
      aria-label={`Knowledge graph of the wire's top stories — ${findingCount.toLocaleString('en-US')} findings connected. Drag nodes to explore; click one to open its story.`}
      className="relative h-[200px] overflow-hidden border-b border-ink bg-paper sm:h-[260px]"
    >
      <div className="pointer-events-none absolute left-8 top-5 z-10 max-sm:left-5 max-sm:top-4">
        <p
          className="type-display text-[25px] uppercase leading-[1.04]"
          style={{ fontVariationSettings: '"wdth" 108', fontWeight: 760 }}
        >
          The graph
        </p>
        <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-soft">
          {findingCount.toLocaleString('en-US')} findings connected · drag the dots
        </p>
      </div>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[280px] -translate-x-1/2 rounded-full bg-ink px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white"
          style={{ left: tip.x, top: Math.max(tip.y - 34, 6) }}
        >
          <span className="block truncate">{tip.title}</span>
        </div>
      )}
      <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />
    </div>
  )
}
