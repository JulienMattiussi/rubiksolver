import { distance, guessColor, TWINS } from './color'
import type { ScanFace } from './plan'
import { mergeSamples, type CellSample } from './sample'
import type { Color } from '../../core/types'

/**
 * When to take a face (pure), once the user said the puzzle is in the
 * frame (ScanView: nothing else tells a puzzle from a wall): the picture
 * shows it once every cell of the frame is surely some cube color and its
 * center, if it tells the face, is the one asked for; it is taken once the
 * colors read stayed the same for a second (on a puzzle of many colors,
 * which a camera cannot name: once every cell's measure barely drifted),
 * which says the puzzle was framed and held still enough, the pictures of
 * that second merged. No closer aim nor stillness is asked: a cell read
 * across two stickers, or a hand that shakes, changes the colors read. The
 * face taken just before is not taken again until the picture changed:
 * without a center, nothing else tells two faces apart.
 */

/** The stickers a face out of shape must show still, at least. */
const SURE_CELLS = 2
/** How long the colors read must stay the same, in milliseconds. */
export const HOLD_MS = 1000
/** On a puzzle of many colors, how far a cell's measure may drift while
 *  held still (the noise of the camera, a hand that barely moves). */
const DRIFT = 12

/** A color, twins alike (red and orange: color.ts). */
const family = (color: Color | null): Color | null =>
  color && (TWINS as readonly Color[]).includes(color) ? TWINS[0]! : color

/** The colors guessed, cell by cell, twins alike (a cell between red and
 *  orange holds still all the same). */
const colorsOf = (cells: readonly CellSample[]): string =>
  cells.map((cell) => family(guessColor(cell.lab).color) ?? '-').join('')

/** Whether two pictures of a face read the same: the same colors (its
 *  stickers' only, out of shape), or on a puzzle of many colors, measures
 *  that barely drifted. */
function same(a: readonly CellSample[], b: readonly CellSample[], face: ScanFace): boolean {
  // A face out of shape: its stickers only, the cells of a sure color in
  // both (the background, a hand, a black side, a sticker's logo may
  // flicker as they like), a few at least.
  if (face.open) {
    let agree = 0
    for (let i = 0; i < a.length; i++) {
      const [was, now] = [guessColor(a[i]!.lab), guessColor(b[i]?.lab ?? a[i]!.lab)]
      if (!was.sure || !now.sure) continue
      if (family(was.color) !== family(now.color)) return false
      agree++
    }
    return agree >= SURE_CELLS
  }
  if (face.named) return colorsOf(a) === colorsOf(b)
  return a.length === b.length && a.every((cell, i) => distance(cell.lab, b[i]!.lab) <= DRIFT)
}

/** Whether a picture shows the face asked for: every cell some sticker
 *  (surely a cube color, its center the face's where it tells it, on a
 *  cube; lit enough on a puzzle of many colors; some sticker at least on a
 *  puzzle out of shape; its middle, on a puzzle read whole). */
export function showsFace(cells: readonly CellSample[], face: ScanFace): boolean {
  if (cells.length !== face.cells.length) return false
  const guesses = cells.map((cell) => guessColor(cell.lab))
  // A face of a puzzle out of shape: black sides and the background
  // between its stickers; some sticker at least.
  if (face.open) return guesses.some((g) => g.sure)
  // A face read whole: its anchor lit in the middle (its seams are dark).
  if (face.whole) return guesses[(guesses.length - 1) >> 1]?.color != null
  if (!face.named) return guesses.every((g) => g.color !== null)
  const middle = face.told && face.center !== null ? guesses[face.center]?.color : face.frontColor
  return !!middle && family(middle) === family(face.frontColor) && guesses.every((g) => g.sure)
}

/** The pictures of the face reading the same so far, since when, and the
 *  face taken before while the picture still shows it. */
export interface Watch {
  readonly since: number
  readonly frames: readonly (readonly CellSample[])[]
  readonly before: readonly CellSample[] | undefined
}

/** A face watched for, after this one taken (if any). */
export const watchAfter = (taken?: readonly CellSample[]): Watch => ({
  since: 0,
  frames: [],
  before: taken,
})

/** A new picture watched, of the face asked for: the face taken (its
 *  cells, merged) once it read the same long enough, else what is watched
 *  now. */
export function watch(
  state: Watch,
  cells: readonly CellSample[],
  now: number,
  face: ScanFace,
): { readonly state: Watch; readonly taken?: CellSample[] } {
  if (!showsFace(cells, face)) return { state: watchAfter() }
  // Still the face taken before: the puzzle has not turned yet.
  if (state.before && same(cells, state.before, face)) return { state }
  const first = state.frames[0]
  if (!first || !same(cells, first, face)) {
    return { state: { ...watchAfter(), since: now, frames: [cells] } }
  }
  const frames = [...state.frames, cells]
  if (now - state.since < HOLD_MS) return { state: { ...state, frames } }
  return { state: watchAfter(), taken: mergeSamples(frames) }
}
