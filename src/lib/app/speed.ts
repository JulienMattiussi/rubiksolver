/** Animation speed: maps a 0..100 slider position to seconds per quarter turn. */

/** Fastest turn (slider at 100). */
export const MIN_TURN_DURATION = 0.06
/** Slowest turn (slider at 0): slow enough to follow a turn closely. */
export const MAX_TURN_DURATION = 2.5

/**
 * Seconds per turn for a slider position (0 = slow, 100 = fast). The scale
 * is exponential: each step changes the speed by the same factor, so the
 * slow end (seconds) and the fast end (hundredths) are both easy to set.
 */
export function durationFromSlider(position: number): number {
  const clamped = Math.max(0, Math.min(100, position))
  return MAX_TURN_DURATION * (MIN_TURN_DURATION / MAX_TURN_DURATION) ** (clamped / 100)
}

/** Slider position (0..100) for a given seconds-per-turn duration. */
export function sliderFromDuration(duration: number): number {
  const position =
    (Math.log(duration / MAX_TURN_DURATION) / Math.log(MIN_TURN_DURATION / MAX_TURN_DURATION)) * 100
  return Math.max(0, Math.min(100, position))
}

/**
 * The pause between two turns: at the slowest speed only, as long as a turn
 * (time to play it by hand on a real puzzle); none otherwise, so a scramble
 * or a step back stay brisk.
 */
export function pauseBetweenTurns(duration: number): number {
  return duration >= MAX_TURN_DURATION ? duration : 0
}
