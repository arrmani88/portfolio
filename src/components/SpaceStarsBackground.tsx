import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const FRAGMENT_SHADER = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    vec2 m = (u_mouse.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);

    // Deep navy background
    vec3 color = vec3(0.01, 0.02, 0.08);

    // Distant stars/particles
    float stars = 0.0;
    vec2 grid = floor(p * 25.0);
    vec2 g_uv = fract(p * 25.0) - 0.5;
    float h = hash(grid);
    if(h > 0.98) {
        float size = sin(u_time * 2.0 + h * 6.28) * 0.5 + 0.5;
        stars = smoothstep(0.1 * size, 0.0, length(g_uv));
    }
    color += vec3(0.4, 0.6, 1.0) * stars;

    // Mouse glow
    float mouse_dist = length(p - m);
    float glow = smoothstep(0.8, 0.0, mouse_dist);
    color += vec3(0.1, 0.2, 0.4) * glow * 0.3;

    // Ambient nebulous clouds
    for(float i = 0.0; i < 3.0; i++) {
        vec2 uv_n = p * (1.0 + i * 0.5);
        float t = u_time * 0.1 * (i + 1.0);
        uv_n += vec2(sin(t + uv_n.y), cos(t + uv_n.x));
        float noise = hash(floor(uv_n)) * 0.1;
        color += vec3(0.05, 0.1, 0.2) * noise;
    }

    gl_FragColor = vec4(color, 1.0);
}`

const SpaceStarsBackground = () => {
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
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse')

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 }
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (e.clientX - rect.left) / rect.width
        const ny = 1.0 - (e.clientY - rect.top) / rect.height
        mouse.x = nx * canvas.width
        mouse.y = ny * canvas.height
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    let frameId: number
    const render = (t: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (timeLocation) gl.uniform1f(timeLocation, t * 0.001)
      if (resolutionLocation) gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      if (mouseLocation) gl.uniform2f(mouseLocation, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      frameId = requestAnimationFrame(render)
    }
    frameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  )
}

export default SpaceStarsBackground
