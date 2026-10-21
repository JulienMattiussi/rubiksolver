import type { CubeColor } from '../../core/types'

/**
 * Colors as a camera sees them (pure): CIE Lab, where a distance is close
 * to how different two colors look, and a first guess of the cube color a
 * measure is, by its hue and its chroma. Lighting shifts every measure, so
 * the guess only tells whether a picture shows a cube; a scan's colors are
 * read against its own centers (classify.ts).
 */

/** Lightness (0 to 100), then green-red and blue-yellow. */
export type Lab = readonly [number, number, number]

const linear = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t) / 116 + 16 / 116)

/** An sRGB color in Lab (D65 white). */
export function labOf(r: number, g: number, b: number): Lab {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)]
  const x = (0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.95047
  const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
  const z = (0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.08883
  const [fx, fy, fz] = [f(x), f(y), f(z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** How different two measures look. Lightness counts half: shade varies
 *  across a face far more than hue does. */
export function distance(a: Lab, b: Lab): number {
  return Math.hypot((a[0] - b[0]) / 2, a[1] - b[1], a[2] - b[2])
}

/** Below this chroma a sticker is white: a light tints it (a webcam's
 *  bluish white reaches 23, a warm light's 20), while a pale orange comes
 *  down to 40 (2026-10-21). */
const WHITE_CHROMA = 30
/** Below this lightness, no sticker: the plastic, a shadow. */
const DARK = 15

/** Whether a measure has some color: not white, nor a glare (which only
 *  takes color away). */
export const colored = ([, a, b]: Lab): boolean => Math.hypot(a, b) >= WHITE_CHROMA

/** Hue bands, in degrees, each up to its bound: red wraps round. A
 *  camera's yellow leans green (up to 120 and more under a cold light),
 *  while a green sticker stays past 140; its orange comes down to 45, a
 *  bright red goes up to 30 (a webcam's, 2026-10-21): each bound sits
 *  between. */
const HUES: readonly [number, CubeColor][] = [
  [39, 'R'],
  [76, 'O'],
  [128, 'Y'],
  [200, 'G'],
  [325, 'B'],
  [360, 'R'],
]

/** Red and orange: their hues come so close under some lights (a red up
 *  to 37, an orange down to 46: 2026-10-21) that no bound tells them
 *  apart; the reading does, every sticker against the others (classify.ts).
 *  A measure near their bound is sure all the same: one of the two. */
export const TWINS: readonly CubeColor[] = ['R', 'O']

/** How far inside its band a measure must be to be sure of its color:
 *  in degrees of hue, in chroma, in lightness. Near a bound, the light
 *  may tip it either way. */
const SURE_HUE = 4
const SURE_CHROMA = 4
const SURE_DARK = 5

export interface ColorGuess {
  /** The cube color it most likely is, or null when it is none (too dark,
   *  or a hue no sticker has). */
  readonly color: CubeColor | null
  /** Far enough inside its band to be sure of it. */
  readonly sure: boolean
}

/** The cube color a measure most likely is, and whether surely. */
export function guessColor([l, a, b]: Lab): ColorGuess {
  if (l < DARK) return { color: null, sure: false }
  const bright = l >= DARK + SURE_DARK
  const chroma = Math.hypot(a, b)
  if (chroma < WHITE_CHROMA) {
    return { color: 'W', sure: bright && chroma <= WHITE_CHROMA - SURE_CHROMA }
  }
  const hue = (Math.atan2(b, a) * 180) / Math.PI
  const deg = hue < 0 ? hue + 360 : hue
  const band = HUES.findIndex(([bound]) => deg < bound)
  const [bound, color] = HUES[band]!
  // How far from each bound, but red's wrap round (0 and 360) and the one
  // between twins.
  const near = (side: number) => {
    const next = HUES[side]
    return !next || (TWINS.includes(color) && TWINS.includes(next[1]))
  }
  const below = band && !near(band - 1) ? deg - HUES[band - 1]![0] : Infinity
  const above = bound !== 360 && !near(band + 1) ? bound - deg : Infinity
  const inside = Math.min(below, above)
  return {
    color,
    sure: bright && chroma >= WHITE_CHROMA + SURE_CHROMA && inside >= SURE_HUE,
  }
}
