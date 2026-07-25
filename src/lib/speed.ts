/** Animation speed: maps a 0..100 slider position to seconds per quarter turn. */

/** Fastest turn (slider at 100). */
export const MIN_TURN_DURATION = 0.06
/** Slowest turn (slider at 0). */
export const MAX_TURN_DURATION = 0.5

/** Seconds per turn for a slider position (0 = slow, 100 = fast). */
export function durationFromSlider(position: number): number {
  const clamped = Math.max(0, Math.min(100, position))
  return MAX_TURN_DURATION - (clamped / 100) * (MAX_TURN_DURATION - MIN_TURN_DURATION)
}

/** Slider position (0..100) for a given seconds-per-turn duration. */
export function sliderFromDuration(duration: number): number {
  return ((MAX_TURN_DURATION - duration) / (MAX_TURN_DURATION - MIN_TURN_DURATION)) * 100
}
