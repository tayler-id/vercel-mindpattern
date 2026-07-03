'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { topicColor } from '@/lib/topic-color'

export interface GraphNode {
  slug: string
  title: string
  section: string
  /** 0..1, by wire rank (1 = top story). Drives node size. */
  weight: number
  entities: string[]
  href: string
}

/** Resolve topicColor()'s CSS var slots to the real Spectrum hexes for WebGL. */
const VAR_HEX: Record<string, number> = {
  'var(--spectrum-1)': 0xe63b12,
  'var(--spectrum-2)': 0x0797a6,
  'var(--spectrum-3)': 0xcf2d7b,
  'var(--spectrum-4)': 0xf5c518,
}

const INK = 0x0e0e0f
const MAX_EDGES = 90
const EDGES_PER_NODE = 3

/** Deterministic PRNG so the scatter is stable across renders. */
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

interface SimNode {
  fx: number
  fy: number
  bx: number
  by: number
  radius: number
  phase: number
  speed: number
  ampX: number
  ampY: number
  mesh: THREE.Mesh
}

/** Build edges from real relations: shared entity first, then shared section. */
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
 * Full-bleed three.js band: the wire's top stories as topic-colored nodes,
 * thin ink edges between stories sharing a section or entity. Gentle drift,
 * subtle pointer parallax, staggered scale-in. Static frame under reduced
 * motion. Clicking a node navigates to its story.
 */
export function KnowledgeGraph({
  nodes,
  findingCount,
}: {
  nodes: GraphNode[]
  findingCount: number
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const host = hostRef.current
    if (!host || nodes.length === 0) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return // no WebGL — the band stays a quiet white strip with its label
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0xffffff, 0)
    renderer.domElement.style.display = 'block'
    host.appendChild(renderer.domElement)

    let w = host.clientWidth || 1
    let h = host.clientHeight || 1
    const scene = new THREE.Scene()
    const group = new THREE.Group()
    scene.add(group)
    const camera = new THREE.OrthographicCamera(0, w, h, 0, -100, 100)

    // ── layout: cluster nodes loosely by section across the band ──
    const rand = mulberry32(nodes.length * 2654435761 + 7)
    const sections = [...new Set(nodes.map((n) => n.section))]
    const centers = new Map<string, { fx: number; fy: number }>()
    sections.forEach((s, k) => {
      centers.set(s, {
        fx: (k + 0.55) / sections.length,
        fy: k % 2 === 0 ? 0.38 : 0.62,
      })
    })

    const circleGeo = new THREE.CircleGeometry(1, 28)
    const materials = new Map<number, THREE.MeshBasicMaterial>()
    const matFor = (hex: number) => {
      let m = materials.get(hex)
      if (!m) {
        m = new THREE.MeshBasicMaterial({ color: hex })
        materials.set(hex, m)
      }
      return m
    }

    const sim: SimNode[] = nodes.map((n) => {
      const c = centers.get(n.section) ?? { fx: 0.5, fy: 0.5 }
      const fx = Math.min(0.96, Math.max(0.04, c.fx + (rand() - 0.5) * 0.42))
      const fy = Math.min(0.86, Math.max(0.14, c.fy + (rand() - 0.5) * 0.52))
      const hex = VAR_HEX[topicColor(n.section).base] ?? 0xe63b12
      const mesh = new THREE.Mesh(circleGeo, matFor(hex))
      mesh.renderOrder = 1
      group.add(mesh)
      return {
        fx,
        fy,
        bx: fx * w,
        by: (1 - fy) * h,
        radius: 3 + n.weight * 7,
        phase: rand() * Math.PI * 2,
        speed: 0.25 + rand() * 0.3,
        ampX: 5 + rand() * 8,
        ampY: 4 + rand() * 6,
        mesh,
      }
    })

    const edges = buildEdges(nodes)
    const linePos = new Float32Array(edges.length * 6)
    const lineGeo = new THREE.BufferGeometry()
    const lineAttr = new THREE.BufferAttribute(linePos, 3)
    lineAttr.setUsage(THREE.DynamicDrawUsage)
    lineGeo.setAttribute('position', lineAttr)
    const lineMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.15 })
    const lines = new THREE.LineSegments(lineGeo, lineMat)
    lines.renderOrder = 0
    group.add(lines)

    // ── pointer parallax + click-to-open ──
    let targetPx = 0
    let targetPy = 0
    const nodeAt = (clientX: number, clientY: number): number => {
      const rect = host.getBoundingClientRect()
      const wx = clientX - rect.left - group.position.x
      const wy = h - (clientY - rect.top) - group.position.y
      for (let i = 0; i < sim.length; i++) {
        const s = sim[i]
        const dx = s.mesh.position.x - wx
        const dy = s.mesh.position.y - wy
        if (dx * dx + dy * dy <= (s.radius + 5) * (s.radius + 5)) return i
      }
      return -1
    }
    const onMove = (ev: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      targetPx = ((ev.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * -14
      targetPy = ((ev.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 8
      host.style.cursor = nodeAt(ev.clientX, ev.clientY) >= 0 ? 'pointer' : 'default'
    }
    const onLeave = () => {
      targetPx = 0
      targetPy = 0
      host.style.cursor = 'default'
    }
    const onClick = (ev: MouseEvent) => {
      const i = nodeAt(ev.clientX, ev.clientY)
      if (i >= 0) router.push(nodes[i].href)
    }
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('click', onClick)

    const update = (t: number) => {
      for (let i = 0; i < sim.length; i++) {
        const s = sim[i]
        // Nodes render settled at full size from the very first frame — the
        // graph must be complete even if rAF never runs (occluded windows,
        // screenshots, prerender). Drift is pure enhancement.
        s.mesh.scale.setScalar(s.radius)
        const drift = reduced ? 0 : 1
        s.mesh.position.set(
          s.bx + Math.sin(t * s.speed + s.phase) * s.ampX * drift,
          s.by + Math.cos(t * s.speed * 0.85 + s.phase * 1.7) * s.ampY * drift,
          0,
        )
      }
      for (let e = 0; e < edges.length; e++) {
        const [a, b] = edges[e]
        const pa = sim[a].mesh.position
        const pb = sim[b].mesh.position
        linePos[e * 6] = pa.x
        linePos[e * 6 + 1] = pa.y
        linePos[e * 6 + 2] = -1
        linePos[e * 6 + 3] = pb.x
        linePos[e * 6 + 4] = pb.y
        linePos[e * 6 + 5] = -1
      }
      lineAttr.needsUpdate = true
      if (!reduced) {
        group.position.x += (targetPx - group.position.x) * 0.06
        group.position.y += (targetPy - group.position.y) * 0.06
      }
      renderer.render(scene, camera)
    }

    const applySize = () => {
      w = host.clientWidth || 1
      h = host.clientHeight || 1
      camera.right = w
      camera.top = h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      for (const s of sim) {
        s.bx = s.fx * w
        s.by = (1 - s.fy) * h
      }
      update(0) // re-render after any resize, even with the loop paused
    }
    applySize()

    const ro = new ResizeObserver(applySize)
    ro.observe(host)

    let raf = 0
    const clock = new THREE.Clock()
    update(0) // settled first frame, synchronously — never a blank band
    if (!reduced) {
      const loop = () => {
        update(clock.getElapsedTime())
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('click', onClick)
      circleGeo.dispose()
      lineGeo.dispose()
      lineMat.dispose()
      for (const m of materials.values()) m.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    }
  }, [nodes, router])

  return (
    <div
      role="img"
      aria-label={`Knowledge graph of the wire's top stories — ${findingCount.toLocaleString('en-US')} findings connected`}
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
          {findingCount.toLocaleString('en-US')} findings connected
        </p>
      </div>
      <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />
    </div>
  )
}
