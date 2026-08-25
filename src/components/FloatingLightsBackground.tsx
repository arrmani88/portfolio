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

// Simple hash for pseudo-randomness
float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
    vec2 uv = v_texCoord;
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);

    // Background color (Deep Space from Aetheric Minimalist)
    vec3 color = vec3(0.075, 0.075, 0.082); // matches #131315 roughly

    // Create multiple "blurred light" layers
    for(float i = 1.0; i < 8.0; i++) {
        float speed = 0.2 + i * 0.1;
        float phase = u_time * speed + i * 123.456;

        // Dynamic position for each light orb
        vec2 pos = vec2(
            sin(phase * 0.7) * 0.8,
            cos(phase * 0.5) * 0.5
        );

        // Distance to the orb center
        float d = length(p - pos);

        // Neon Cyan accent color from design system: #00f0ff (0, 0.94, 1.0)
        vec3 lightColor = vec3(0.0, 0.94, 1.0);

        // Soft, blurred intensity falloff
        float radius = 0.4 + sin(phase * 0.3) * 0.2;
        float strength = 0.02 / (d * d / radius + 0.01);

        // Add subtle variation in color/intensity per layer
        color += lightColor * strength * (0.3 / i);
    }

    // Add a subtle vignette for depth
    float vignette = 1.0 - length(p) * 0.3;
    color *= vignette;

    // Dither: breaks up 8-bit color banding in the light falloff so the
    // gradient reads as smooth instead of stepped rings.
    float dither = (hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) - 0.5) / 255.0;
    color += dither;

    gl_FragColor = vec4(color, 1.0);
}`

const FloatingLightsBackground = () => {
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

export default FloatingLightsBackground
