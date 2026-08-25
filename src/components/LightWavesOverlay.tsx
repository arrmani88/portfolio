import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const FRAGMENT_SHADER = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_colorPrimary;
uniform vec3 u_colorSecondary;

const float WAVE_COUNT = 7.0;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);

    vec3 color = vec3(0.0);

    for (float i = 0.0; i < WAVE_COUNT; i++) {
        float seed = i * 12.9898;
        float freq = 1.0 + hash(seed) * 2.0;
        float speed = 0.15 + hash(seed + 1.0) * 0.25;
        float amp = 0.08 + hash(seed + 2.0) * 0.1;
        float yOffset = (hash(seed + 3.0) - 0.5) * 0.25;
        float phase = hash(seed + 4.0) * 6.2831;

        float waveY = yOffset + sin(p.x * freq + u_time * speed + phase) * amp;
        float d = abs(p.y - waveY);

        // Bright thin core + soft surrounding halo (division only, no exp() —
        // constants tuned so the peak brightness at d=0 still matches 0.05,
        // same as the previous exp()-based version)
        float core = 0.012 / (d + 0.006);
        float halo = 0.00075 / (d * d + 0.015);

        float isPurple = (i == 2.0 || i == 5.0) ? 1.0 : 0.0;
        vec3 waveColor = mix(u_colorPrimary, u_colorSecondary, isPurple);
        color += waveColor * (core * 0.1 + halo);
    }

    // Keep the glow confined to a middle band, fading out before the top/bottom edges
    float verticalMask = 1.0 - smoothstep(0.22, 0.45, abs(p.y));
    color *= verticalMask;

    // Brighten
    color *= 1.6;

    // Dither to avoid banding in the glow falloff
    float dither = (hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) - 0.5) / 255.0;
    color += dither;

    gl_FragColor = vec4(color, 1.0);
}`

function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.trim().replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return [r, g, b]
}

const LightWavesOverlay = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const syncSize = () => {
      const w = canvas.clientWidth || 1280
      const h = canvas.clientHeight || 720
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const resizeObserver = new ResizeObserver(syncSize)
    resizeObserver.observe(canvas)
    syncSize()

    const gl = canvas.getContext('webgl')
    if (!gl) return

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const program = gl.createProgram()
    const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!program || !vertexShader || !fragmentShader) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const colorPrimaryLocation = gl.getUniformLocation(program, 'u_colorPrimary')
    const colorSecondaryLocation = gl.getUniformLocation(program, 'u_colorSecondary')

    const rootStyle = getComputedStyle(document.documentElement)
    const colorPrimary = hexToRgb01(rootStyle.getPropertyValue('--color-primary'))
    const colorSecondary = hexToRgb01(rootStyle.getPropertyValue('--color-secondary'))

    let frameId: number
    const render = (t: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (timeLocation) gl.uniform1f(timeLocation, t * 0.001)
      if (resolutionLocation) gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      if (colorPrimaryLocation) gl.uniform3f(colorPrimaryLocation, ...colorPrimary)
      if (colorSecondaryLocation) gl.uniform3f(colorSecondaryLocation, ...colorSecondary)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      frameId = requestAnimationFrame(render)
    }
    frameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
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

export default LightWavesOverlay
