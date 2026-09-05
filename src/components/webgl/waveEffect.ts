const WAVE_COUNT = 7

const VERTEX_SHADER = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const FRAGMENT_SHADER = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_colorPrimary;
uniform vec3 u_colorSecondary;
// freq/speed/amp/yOffset and phase/isPurple, precomputed in JS once instead of
// per-pixel per-frame (see buildWaveParams).
uniform vec4 u_wave[${WAVE_COUNT}];
uniform vec2 u_wavePhaseColor[${WAVE_COUNT}];

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    p.y += 0.35;
    if (u_resolution.x < 640.0) p.y += 0.4;

    vec3 color = vec3(0.0);

    for (int i = 0; i < ${WAVE_COUNT}; i++) {
        vec4 w = u_wave[i];
        vec2 pc = u_wavePhaseColor[i];

        float waveY = w.w + sin(p.x * w.x + u_time * w.y + pc.x) * w.z;
        float d = abs(p.y - waveY);

        float core = 0.012 / (d + 0.006);
        float halo = 0.00075 / (d * d + 0.015);

        vec3 waveColor = mix(u_colorPrimary, u_colorSecondary, pc.y);
        color += waveColor * (core * 0.1 + halo);
    }

    float verticalMask = 1.0 - smoothstep(0.22, 0.45, abs(p.y));
    color *= verticalMask;
    color *= 1.6;

    float dither = (hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) - 0.5) / 255.0;
    color += dither;

    gl_FragColor = vec4(color, 1.0);
}`

function hash(n: number) {
  const s = Math.sin(n) * 43758.5453123
  return s - Math.floor(s)
}

function buildWaveParams() {
  const wave: number[] = []
  const phaseColor: number[] = []
  for (let i = 0; i < WAVE_COUNT; i++) {
    const seed = i * 12.9898
    const freq = 1.0 + hash(seed) * 2.0
    const speed = 0.15 + hash(seed + 1.0) * 0.25
    const amp = 0.06 + hash(seed + 2.0) * 0.07
    const yOffset = (hash(seed + 3.0) - 0.5) * 0.25
    const phase = hash(seed + 4.0) * 6.2831
    const isPurple = i === 2 || i === 5 ? 1.0 : 0.0
    wave.push(freq, speed, amp, yOffset)
    phaseColor.push(phase, isPurple)
  }
  return { wave: new Float32Array(wave), phaseColor: new Float32Array(phaseColor) }
}

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
  const waveLocation = gl.getUniformLocation(program, 'u_wave')
  const wavePhaseColorLocation = gl.getUniformLocation(program, 'u_wavePhaseColor')

  gl.useProgram(program)
  if (colorPrimaryLocation) gl.uniform3f(colorPrimaryLocation, ...colorPrimary)
  if (colorSecondaryLocation) gl.uniform3f(colorSecondaryLocation, ...colorSecondary)
  const { wave, phaseColor } = buildWaveParams()
  if (waveLocation) gl.uniform4fv(waveLocation, wave)
  if (wavePhaseColorLocation) gl.uniform2fv(wavePhaseColorLocation, phaseColor)

  return {
    draw(time, width, height) {
      gl.useProgram(program)
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
