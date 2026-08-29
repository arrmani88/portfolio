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
    p.y += 0.35;
    if (u_resolution.x < 640.0) p.y += 0.4;

    vec3 color = vec3(0.0);

    for (float i = 0.0; i < WAVE_COUNT; i++) {
        float seed = i * 12.9898;
        float freq = 1.0 + hash(seed) * 2.0;
        float speed = 0.15 + hash(seed + 1.0) * 0.25;
        float amp = 0.06 + hash(seed + 2.0) * 0.07;
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

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

export type WaveEffect = {
  draw: (time: number, width: number, height: number) => void
}

export function createWaveEffect(
  gl: WebGLRenderingContext,
  colorPrimary: [number, number, number],
  colorSecondary: [number, number, number],
): WaveEffect | null {
  const program = gl.createProgram()
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  if (!program || !vertexShader || !fragmentShader) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const positionLocation = gl.getAttribLocation(program, 'a_position')

  const timeLocation = gl.getUniformLocation(program, 'u_time')
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  const colorPrimaryLocation = gl.getUniformLocation(program, 'u_colorPrimary')
  const colorSecondaryLocation = gl.getUniformLocation(program, 'u_colorSecondary')

  gl.useProgram(program)
  // These never change frame to frame, so they're uploaded once instead of every frame
  if (colorPrimaryLocation) gl.uniform3f(colorPrimaryLocation, ...colorPrimary)
  if (colorSecondaryLocation) gl.uniform3f(colorSecondaryLocation, ...colorSecondary)

  return {
    draw(time, width, height) {
      gl.useProgram(program)
      // The wave quad covers every pixel opaquely, so it doubles as this frame's clear
      // -- draw it first, with blending off, and the particle pass composites on top.
      gl.disable(gl.BLEND)

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      if (timeLocation) gl.uniform1f(timeLocation, time)
      if (resolutionLocation) gl.uniform2f(resolutionLocation, width, height)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
  }
}
