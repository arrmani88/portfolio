import { useEffect, useRef } from 'react'
import { createWaveEffect } from './webgl/waveEffect'
import { createParticleSphereEffect } from './webgl/particleSphereEffect'

function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.trim().replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return [r, g, b]
}

const BackgroundScene = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      depth: false,
      stencil: false,
      antialias: false,
    })
    if (!gl) return

    const rootStyle = getComputedStyle(document.documentElement)
    const colorPrimary = hexToRgb01(rootStyle.getPropertyValue('--color-primary'))
    const colorSecondary = hexToRgb01(rootStyle.getPropertyValue('--color-secondary'))

    const waveEffect = createWaveEffect(gl, colorPrimary, colorSecondary)
    const sphereEffect = createParticleSphereEffect(gl, colorPrimary, colorSecondary)
    if (!waveEffect || !sphereEffect) return

    const syncSize = () => {
      const w = canvas.clientWidth || 1280
      const h = canvas.clientHeight || 720
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
    }

    const resizeObserver = new ResizeObserver(syncSize)
    resizeObserver.observe(canvas)
    syncSize()

    let frameId = 0
    let lastRenderTime = 0
    // Both effects only move with slow ambient motion, so a 30fps cap is visually
    // indistinguishable from 60/120fps here but meaningfully cuts GPU work per second.
    const minFrameInterval = 1000 / 30
    const render = (t: number) => {
      frameId = requestAnimationFrame(render)
      if (t - lastRenderTime < minFrameInterval) return
      lastRenderTime = t

      const time = t * 0.001
      const width = canvas.width
      const height = canvas.height

      // The wave pass writes an opaque color to every pixel, so it doubles as the
      // frame clear -- no separate gl.clear() needed before it.
      waveEffect.draw(time, width, height)
      // The sphere's glowing core is drawn as part of this same call (see
      // particleSphereEffect.ts), so it always moves in lockstep with the particles --
      // no separate DOM element or per-frame JS/CSS sync required.
      sphereEffect.draw(time, width, height)
    }

    // Pause the whole render loop when the scene isn't on screen, instead of burning
    // GPU cycles drawing frames nobody sees
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!frameId) frameId = requestAnimationFrame(render)
      } else if (frameId) {
        cancelAnimationFrame(frameId)
        frameId = 0
      }
    })
    intersectionObserver.observe(canvas)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 mix-blend-screen h-full w-full"
    />
  )
}

export default BackgroundScene
