// TEMP: shared timing for the boot/landing sequence, remove alongside the rest of
// the TEMP intro code when no longer wanted. Centralized here so BootOverlay's own
// fade timing, the sphere's convergence animation, and the scene/greeting reveal
// delays all derive from each other instead of being hand-copied magic numbers
// across separate files that can silently drift out of sync.

export const BOOT_FADE_DELAY_S = 1.5
export const BOOT_FADE_DURATION_S = 0.6
export const BOOT_DONE_S = BOOT_FADE_DELAY_S + BOOT_FADE_DURATION_S

// A bit of buffer after the boot overlay fully clears before anything else starts.
export const SCENE_FADE_IN_DELAY_S = BOOT_DONE_S + 0.4

// Synced with the canvas fade-in so the particles are actually seen converging
// (see particleSphereEffect.ts).
export const SPHERE_CONVERGE_START_S = SCENE_FADE_IN_DELAY_S
export const SPHERE_CONVERGE_DURATION_S = 0.9
export const SPHERE_CONVERGE_DONE_S = SPHERE_CONVERGE_START_S + SPHERE_CONVERGE_DURATION_S

// The greeting and CTA used to wait via SPHERE_CONVERGE_DONE_S + a fixed offset --
// but that's a *different clock* than the sphere's own convergence: the sphere runs
// on BackgroundScene's render-loop time (anchored to whenever its IntersectionObserver
// first fires, which is asynchronous and not guaranteed to line up with page-paint
// time), while a CSS animation-delay on a separately-mounted component counts from
// that component's own mount/paint time. Those two clocks were assumed to stay in
// sync, but on a slower load they can drift apart -- which is exactly what caused the
// sphere sometimes finishing *after* the greeting had already started revealing.
//
// The fix: BackgroundScene now calls onSphereConverged() for real once convergence
// actually finishes, and Home.tsx doesn't mount the greeting/CTA until that signal
// arrives -- so these are just small relative buffers counted from that real event,
// not absolute offsets from page load.
export const GREETING_REVEAL_DELAY_AFTER_CONVERGE_S = 0.3
export const CTA_REVEAL_DELAY_AFTER_CONVERGE_S = 1.5
