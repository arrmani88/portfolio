import { useEffect, useRef } from 'react'

const GRID_GAP = 18
const INTERACTION_RADIUS = 400
const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS
const PUSH_STRENGTH = 50
const EASE = 0.15
const DOT_RADIUS = 1.5
const RESIZE_DEBOUNCE_MS = 150

interface Dot {
  baseX: number
  baseY: number
  x: number
  y: number
}

const DotBackground = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dots: Dot[] = []
    let dotColor = getComputedStyle(container).getPropertyValue('--color-dot').trim()
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const buildGrid = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const previous = new Map(dots.map((dot) => [`${dot.baseX},${dot.baseY}`, dot]))

      const cols = Math.ceil(width / GRID_GAP) + 1
      const rows = Math.ceil(height / GRID_GAP) + 1
      const next: Dot[] = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const baseX = col * GRID_GAP
          const baseY = row * GRID_GAP
          const existing = previous.get(`${baseX},${baseY}`)
          next.push(existing ?? { baseX, baseY, x: baseX, y: baseY })
        }
      }
      dots = next
    }

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = dotColor
      for (const dot of dots) {
        ctx.beginPath()
        ctx.arc(dot.baseX, dot.baseY, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    buildGrid()

    let resizeTimeout: number | undefined
    const handleResize = () => {
      if (resizeTimeout) window.clearTimeout(resizeTimeout)
      resizeTimeout = window.setTimeout(() => {
        buildGrid()
        if (prefersReducedMotion) drawStatic()
      }, RESIZE_DEBOUNCE_MS)
    }
    window.addEventListener('resize', handleResize)

    const themeObserver = new MutationObserver(() => {
      dotColor = getComputedStyle(container).getPropertyValue('--color-dot').trim()
      if (prefersReducedMotion) drawStatic()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    if (prefersReducedMotion) {
      drawStatic()
      return () => {
        if (resizeTimeout) window.clearTimeout(resizeTimeout)
        themeObserver.disconnect()
        window.removeEventListener('resize', handleResize)
      }
    }

    const mouse = { x: -9999, y: -9999 }
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const handleMouseLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    let frameId: number

    const tick = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = dotColor

      for (const dot of dots) {
        const dx = dot.baseX - mouse.x
        const dy = dot.baseY - mouse.y
        const distSq = dx * dx + dy * dy

        let targetX = dot.baseX
        let targetY = dot.baseY

        if (distSq < INTERACTION_RADIUS_SQ && distSq > 0.0001) {
          const distance = Math.sqrt(distSq)
          const push = (1 - distance / INTERACTION_RADIUS) * PUSH_STRENGTH
          targetX = dot.baseX + (dx / distance) * push
          targetY = dot.baseY + (dy / distance) * push
        }

        dot.x += (targetX - dot.x) * EASE
        dot.y += (targetY - dot.y) * EASE

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameId)
      if (resizeTimeout) window.clearTimeout(resizeTimeout)
      themeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div ref={containerRef} className="dot-bg pointer-events-none fixed inset-0 -z-10">
      <canvas ref={canvasRef} className="dot-bg-canvas" aria-hidden="true" />
    </div>
  )
}

export default DotBackground
