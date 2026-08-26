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
export const SPHERE_CONVERGE_DURATION_S = 0.5
export const SPHERE_CONVERGE_DONE_S = SPHERE_CONVERGE_START_S + SPHERE_CONVERGE_DURATION_S

// The greeting waits for the sphere to finish assembling, plus a bit more.
export const GREETING_REVEAL_DELAY_S = SPHERE_CONVERGE_DONE_S + 0.3

// GREETING_REVEAL_DELAY_S is when the greeting *starts* revealing, not when it
// finishes -- its own reveal animation then runs ~0.5s on top of that
// (AssistantGreeting.module.css's --reveal-duration, not itself derived from here
// since that's plain CSS). This adds a 1.5s buffer past that start point.
export const CTA_REVEAL_DELAY_S = GREETING_REVEAL_DELAY_S + 1.5
