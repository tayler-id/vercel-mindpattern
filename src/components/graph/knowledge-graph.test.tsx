import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { KnowledgeGraph, type GraphNode } from './knowledge-graph'

const router = vi.hoisted(() => ({
  push: vi.fn(),
}))

const three = vi.hoisted(() => {
  const state = {
    throwRenderer: false,
    renderers: [] as Array<{ domElement: HTMLCanvasElement; dispose: ReturnType<typeof vi.fn> }>,
    meshes: [] as Array<{ position: { x: number; y: number; z: number }; visible: boolean }>,
    geometries: [] as Array<{ dispose: ReturnType<typeof vi.fn>; setDrawRange?: ReturnType<typeof vi.fn> }>,
    materials: [] as Array<{ dispose: ReturnType<typeof vi.fn> }>,
    scenes: [] as Array<{ add: ReturnType<typeof vi.fn> }>,
  }

  class WebGLRenderer {
    domElement = document.createElement('canvas')
    setPixelRatio = vi.fn()
    setClearColor = vi.fn()
    setSize = vi.fn()
    render = vi.fn()
    dispose = vi.fn()

    constructor() {
      if (state.throwRenderer) throw new Error('no webgl')
      state.renderers.push(this)
    }
  }

  class Scene {
    add = vi.fn()
    constructor() {
      state.scenes.push(this)
    }
  }

  class OrthographicCamera {
    right = 0
    top = 0
    updateProjectionMatrix = vi.fn()
    constructor(
      public left: number,
      right: number,
      top: number,
      public bottom: number,
      public near: number,
      public far: number,
    ) {
      this.right = right
      this.top = top
    }
  }

  class BufferGeometry {
    dispose = vi.fn()
    setAttribute = vi.fn()
    setDrawRange = vi.fn()
    constructor() {
      state.geometries.push(this)
    }
  }

  class CircleGeometry {
    dispose = vi.fn()
    constructor() {
      state.geometries.push(this)
    }
  }

  class RingGeometry extends CircleGeometry {}

  class BufferAttribute {
    needsUpdate = false
    setUsage = vi.fn().mockReturnThis()
    constructor(
      public array: Float32Array,
      public itemSize: number,
    ) {}
  }

  class MeshBasicMaterial {
    dispose = vi.fn()
    constructor(public params: Record<string, unknown>) {
      state.materials.push(this)
    }
  }

  class LineBasicMaterial extends MeshBasicMaterial {}

  class Mesh {
    renderOrder = 0
    visible = true
    scale = { setScalar: vi.fn() }
    position = {
      x: 0,
      y: 0,
      z: 0,
      set: vi.fn((x: number, y: number, z: number) => {
        this.position.x = x
        this.position.y = y
        this.position.z = z
      }),
    }
    constructor(
      public geometry: unknown,
      public material: unknown,
    ) {
      state.meshes.push(this)
    }
  }

  class LineSegments extends Mesh {}

  return {
    state,
    WebGLRenderer,
    Scene,
    OrthographicCamera,
    CircleGeometry,
    RingGeometry,
    BufferGeometry,
    BufferAttribute,
    MeshBasicMaterial,
    LineBasicMaterial,
    Mesh,
    LineSegments,
    DynamicDrawUsage: 'dynamic',
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

vi.mock('three', () => three)

const nodes: GraphNode[] = [
  {
    slug: 'one',
    title: 'Story One',
    section: 'models',
    weight: 0.8,
    entities: ['openai', 'agents'],
    href: '/s/one',
  },
  {
    slug: 'two',
    title: 'Story Two',
    section: 'models',
    weight: 0.4,
    entities: ['openai'],
    href: '/s/two',
  },
  {
    slug: 'three',
    title: 'Story Three',
    section: 'unknown-section',
    weight: 0.2,
    entities: ['agents'],
    href: '/s/three',
  },
]

function installAnimationMocks() {
  const frames: FrameRequestCallback[] = []
  const raf = vi.fn((callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  const cancel = vi.fn()
  vi.stubGlobal('requestAnimationFrame', raf)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  return { frames, raf, cancel }
}

function firstNodePoint(host: HTMLElement) {
  const mesh = three.state.meshes[0]
  return {
    x: mesh.position.x,
    y: host.clientHeight - mesh.position.y,
  }
}

describe('KnowledgeGraph', () => {
  beforeEach(() => {
    three.state.throwRenderer = false
    three.state.renderers.length = 0
    three.state.meshes.length = 0
    three.state.geometries.length = 0
    three.state.materials.length = 0
    three.state.scenes.length = 0
    router.push.mockReset()
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 260 })
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, right: 640, bottom: 260, width: 640, height: 260, x: 0, y: 0, toJSON: () => ({}) }),
    })
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 })
    installAnimationMocks()
  })

  it('renders the accessible graph shell without starting WebGL for empty data', () => {
    const { container } = render(<KnowledgeGraph nodes={[]} findingCount={1200} />)

    expect(screen.getByRole('img')).toHaveAccessibleName(/1,200 findings connected/)
    expect(screen.getByText('The graph')).toBeInTheDocument()
    expect(container.querySelector('canvas')).not.toBeInTheDocument()
  })

  it('returns cleanly when WebGL cannot be created', () => {
    three.state.throwRenderer = true
    const { container } = render(<KnowledgeGraph nodes={nodes} findingCount={3} />)

    expect(container.querySelector('canvas')).not.toBeInTheDocument()
  })

  it('renders, resizes, hovers, drags, opens nodes, and cleans up resources', () => {
    const animation = installAnimationMocks()
    let resizeCallback: ResizeObserverCallback | null = null
    class ResizeObserverTest {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback
      }
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverTest)

    const { container, unmount } = render(<KnowledgeGraph nodes={nodes} findingCount={3210} />)
    const host = container.querySelector('[aria-hidden="true"]') as HTMLElement
    const canvas = container.querySelector('canvas')
    const renderer = three.state.renderers[0]

    expect(canvas).toBeInTheDocument()
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(2)
    expect(renderer.setClearColor).toHaveBeenCalledWith(0xffffff, 0)
    expect(renderer.setSize).toHaveBeenCalledWith(640, 260)

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 720 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 300 })
    act(() => {
      resizeCallback?.([], {} as ResizeObserver)
    })
    expect(renderer.setSize).toHaveBeenLastCalledWith(720, 300)

    const point = firstNodePoint(host)
    fireEvent.pointerDown(host, { clientX: 9999, clientY: 9999, pointerId: 1 })
    fireEvent.pointerMove(host, { clientX: 9999, clientY: 9999 })
    expect(screen.queryByText('Story One')).not.toBeInTheDocument()
    fireEvent.pointerMove(host, { clientX: point.x, clientY: point.y })
    expect(screen.getByText('Story One')).toBeInTheDocument()
    act(() => {
      animation.frames.shift()?.(16)
    })
    fireEvent.pointerMove(host, { clientX: point.x + 1, clientY: point.y + 1 })
    expect(screen.getByText('Story One')).toBeInTheDocument()

    fireEvent.pointerDown(host, { clientX: point.x, clientY: point.y, pointerId: 1 })
    fireEvent.pointerUp(host, { clientX: point.x, clientY: point.y })
    expect(router.push).toHaveBeenCalledWith('/s/one')
    router.push.mockClear()

    fireEvent.pointerDown(host, { clientX: point.x, clientY: point.y, pointerId: 1 })
    act(() => {
      animation.frames.shift()?.(32)
    })
    fireEvent.pointerMove(host, { clientX: point.x + 30, clientY: point.y + 30 })
    fireEvent.pointerUp(host, { clientX: point.x + 30, clientY: point.y + 30 })
    expect(router.push).not.toHaveBeenCalled()

    fireEvent.pointerLeave(host)
    expect(screen.queryByText('Story One')).not.toBeInTheDocument()

    expect(animation.raf).toHaveBeenCalled()

    unmount()
    expect(renderer.dispose).toHaveBeenCalled()
    expect(three.state.geometries.every((geometry) => geometry.dispose.mock.calls.length > 0)).toBe(true)
    expect(three.state.materials.every((material) => material.dispose.mock.calls.length > 0)).toBe(true)
    expect(canvas?.parentNode).not.toBe(host)
  })

  it('runs the animation frame path with reduced motion enabled', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({ matches: true })),
    })
    const animation = installAnimationMocks()

    render(<KnowledgeGraph nodes={nodes} findingCount={3} />)

    act(() => {
      animation.frames.shift()?.(16)
    })
    expect(three.state.renderers[0].render).toHaveBeenCalled()
  })
})
