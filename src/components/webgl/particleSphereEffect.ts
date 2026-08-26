const VERTEX_SHADER = `attribute vec3 a_dir;
attribute float a_radius;
attribute float a_seed;
attribute float a_layer;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_cameraDistance;
uniform float u_focalLength;
uniform vec2 u_screenOffset;
uniform float u_jump;
uniform vec3 u_colorPrimary;
uniform vec3 u_colorSecondary;

varying vec3 v_color;
varying float v_intensity;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

vec3 rotateY(vec3 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
}

vec3 rotateX(vec3 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
}

// A fixed 15% of particles (by seed) are the secondary color, the rest primary
vec3 themeColor(float seed) {
  return hash(seed) < 0.15 ? u_colorSecondary : u_colorPrimary;
}

void main() {
  float speed = 0.2 + hash(a_seed) * 0.4;
  float phase = hash(a_seed + 1.0) * 6.2831;
  float amp = 0.05 + hash(a_seed + 2.0) * 0.06;

  vec3 dir = a_dir;

  // Sparkle layer drifts at its own slow rate, independent of the shell's rotation
  if (a_layer > 0.5 && a_layer < 1.5) {
    float driftSpeed = (hash(a_seed + 3.0) - 0.5) * 0.5;
    dir = rotateY(dir, u_time * driftSpeed);
  }

  float radius = a_radius;
  if (a_layer < 1.5) {
    radius += sin(u_time * speed + phase) * amp;
  }

  vec3 rotated = rotateX(rotateY(dir, u_time * 0.15), sin(u_time * 0.09) * 0.35);
  vec3 pos = rotated * radius;

  // Real perspective: a camera sits u_cameraDistance away looking at the sphere.
  // Particles nearer the camera (larger pos.z) project bigger and get a bigger
  // point size below -- that combined size+position falloff is what actually
  // reads as a round volume instead of a flat disc of dots.
  float front = rotated.z * 0.5 + 0.5;
  float camDenom = u_cameraDistance - pos.z;
  float perspective = u_focalLength / camDenom;

  vec2 clip = pos.xy * perspective;
  if (u_resolution.x > u_resolution.y) {
    clip.x *= u_resolution.y / u_resolution.x;
  } else {
    clip.y *= u_resolution.x / u_resolution.y;
  }

  gl_Position = vec4(clip + u_screenOffset + vec2(0.0, u_jump), 0.0, 1.0);

  float depthSize = u_cameraDistance / camDenom;

  // The sphere's on-screen diameter scales with the viewport's smaller side (see the
  // aspect correction above), so particle size must scale with it too -- otherwise a
  // fixed pixel size looks fine on desktop but chunky/oversized on a small mobile screen.
  float viewportScale = clamp(min(u_resolution.x, u_resolution.y) / 900.0, 0.4, 1.5);

  float baseSize = 10.5;
  vec3 color = themeColor(a_seed + 4.0);
  float intensity = mix(0.35, 1.0, front);

  if (a_layer > 0.5 && a_layer < 1.5) {
    baseSize = 8.5;
    float twinkle = 0.4 + 0.6 * (sin(u_time * (1.5 + hash(a_seed + 5.0) * 2.0) + phase) * 0.5 + 0.5);
    intensity *= twinkle;
  } else if (a_layer >= 1.5) {
    // The bright core lives in this same draw call, sharing u_screenOffset/u_jump with
    // every other particle -- it moves in perfect lockstep by construction, no separate
    // DOM element or per-frame JS/CSS sync needed.
    baseSize = 95.0 + sin(u_time * 0.6 + a_seed * 10.0) * 18.0;
    color = vec3(1.0, 1.0, 1.0);
    intensity = 0.85 + sin(u_time * 0.8 + a_seed * 6.0) * 0.15;
  }

  v_color = color;
  v_intensity = intensity;

  gl_PointSize = clamp(baseSize * depthSize * u_pixelRatio * viewportScale, 1.0, 140.0);
}`

const FRAGMENT_SHADER = `precision highp float;
varying vec3 v_color;
varying float v_intensity;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.16, 0.0, d);
  float haloRaw = smoothstep(0.5, 0.0, d);
  float halo = haloRaw * haloRaw;
  float glow = core + halo * 0.45;
  gl_FragColor = vec4(v_color * glow * v_intensity, glow * v_intensity);
}`

const SHELL_COUNT = 882
const SPARKLE_COUNT = 258
const CORE_COUNT = 24
const TOTAL_COUNT = SHELL_COUNT + SPARKLE_COUNT + CORE_COUNT

// Evenly distributes `count` points across a unit sphere (no polar clustering).
function fibonacciDir(i: number, count: number): [number, number, number] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const y = 1 - (i / Math.max(1, count - 1)) * 2
  const r = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = goldenAngle * i
  return [Math.cos(theta) * r, y, Math.sin(theta) * r]
}

function buildParticleBuffers() {
  const dirs = new Float32Array(TOTAL_COUNT * 3)
  const radii = new Float32Array(TOTAL_COUNT)
  const seeds = new Float32Array(TOTAL_COUNT)
  const layers = new Float32Array(TOTAL_COUNT)

  let cursor = 0
  for (let i = 0; i < SHELL_COUNT; i++) {
    const [x, y, z] = fibonacciDir(i, SHELL_COUNT)
    dirs.set([x, y, z], cursor * 3)
    radii[cursor] = 1.0
    seeds[cursor] = Math.random()
    layers[cursor] = 0
    cursor++
  }
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const [x, y, z] = fibonacciDir(i, SPARKLE_COUNT)
    dirs.set([x, y, z], cursor * 3)
    radii[cursor] = 1.15 + Math.random() * 0.5
    seeds[cursor] = Math.random()
    layers[cursor] = 1
    cursor++
  }
  for (let i = 0; i < CORE_COUNT; i++) {
    const [x, y, z] = fibonacciDir(i, CORE_COUNT)
    dirs.set([x, y, z], cursor * 3)
    radii[cursor] = Math.random() * 0.05
    seeds[cursor] = Math.random()
    layers[cursor] = 2
    cursor++
  }
  return { dirs, radii, seeds, layers }
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

export type ParticleSphereEffect = {
  draw: (time: number, width: number, height: number) => void
}

export function createParticleSphereEffect(
  gl: WebGLRenderingContext,
  colorPrimary: [number, number, number],
  colorSecondary: [number, number, number],
): ParticleSphereEffect | null {
  const program = gl.createProgram()
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  if (!program || !vertexShader || !fragmentShader) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  const { dirs, radii, seeds, layers } = buildParticleBuffers()

  const makeBuffer = (data: Float32Array) => {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    return buffer
  }

  const dirBuffer = makeBuffer(dirs)
  const radiusBuffer = makeBuffer(radii)
  const seedBuffer = makeBuffer(seeds)
  const layerBuffer = makeBuffer(layers)

  const dirLocation = gl.getAttribLocation(program, 'a_dir')
  const radiusLocation = gl.getAttribLocation(program, 'a_radius')
  const seedLocation = gl.getAttribLocation(program, 'a_seed')
  const layerLocation = gl.getAttribLocation(program, 'a_layer')

  const timeLocation = gl.getUniformLocation(program, 'u_time')
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  const pixelRatioLocation = gl.getUniformLocation(program, 'u_pixelRatio')
  const cameraDistanceLocation = gl.getUniformLocation(program, 'u_cameraDistance')
  const focalLengthLocation = gl.getUniformLocation(program, 'u_focalLength')
  const screenOffsetLocation = gl.getUniformLocation(program, 'u_screenOffset')
  const jumpLocation = gl.getUniformLocation(program, 'u_jump')
  const colorPrimaryLocation = gl.getUniformLocation(program, 'u_colorPrimary')
  const colorSecondaryLocation = gl.getUniformLocation(program, 'u_colorSecondary')

  gl.useProgram(program)
  // These never change frame to frame, so they're uploaded once instead of every frame
  if (pixelRatioLocation) gl.uniform1f(pixelRatioLocation, 1)
  if (cameraDistanceLocation) gl.uniform1f(cameraDistanceLocation, 6.0)
  if (focalLengthLocation) gl.uniform1f(focalLengthLocation, 1.13)
  if (screenOffsetLocation) gl.uniform2f(screenOffsetLocation, 0.6, 0.3)
  if (colorPrimaryLocation) gl.uniform3f(colorPrimaryLocation, ...colorPrimary)
  if (colorSecondaryLocation) gl.uniform3f(colorSecondaryLocation, ...colorSecondary)

  const bindAttribute = (buffer: WebGLBuffer | null, location: number, size: number) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
  }

  return {
    draw(time, width, height) {
      gl.useProgram(program)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

      // WebGL1 has no VAOs, so switching programs means re-pointing attributes each
      // frame -- cheap (four buffer binds) and avoids state leaking from the other effect.
      bindAttribute(dirBuffer, dirLocation, 3)
      bindAttribute(radiusBuffer, radiusLocation, 1)
      bindAttribute(seedBuffer, seedLocation, 1)
      bindAttribute(layerBuffer, layerLocation, 1)

      if (timeLocation) gl.uniform1f(timeLocation, time)
      if (resolutionLocation) gl.uniform2f(resolutionLocation, width, height)

      // Smooth continuous jump: abs(sin) rises and hangs at the top like a real jump's
      // apex, then rebounds quickly at the bottom -- fully smooth, no popping or resets.
      const jump = Math.abs(Math.sin(time * 1.2)) * 0.035
      if (jumpLocation) gl.uniform1f(jumpLocation, jump)

      gl.drawArrays(gl.POINTS, 0, TOTAL_COUNT)
    },
  }
}
