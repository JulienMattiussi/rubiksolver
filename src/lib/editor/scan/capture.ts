import { guessColor } from './color'
import { mergeSamples, type CellSample } from './sample'
import type { Color } from '../../core/types'

/**
 * When to take a face (pure): the picture shows it once every cell of the
 * frame is surely some cube color and its center is the face asked for;
 * it is taken once the colors read stayed the same for two seconds, which
 * says the cube was framed and held still enough, the pictures of those
 * two seconds merged. No closer aim nor stillness is asked: a cell read
 * across two stickers, or a hand that shakes, changes the colors read.
 */

/** How long the colors read must stay the same, in milliseconds. */
export const HOLD_MS = 2000

/** Red and orange tell apart only against each other (classify.ts): a
 *  center of either may be the other in this light. */
const LOOKS_LIKE: Partial<Record<Color, readonly Color[]>> = { R: ['R', 'O'], O: ['O', 'R'] }

/** The colors a picture shows, cell by cell, if it shows the face whose
 *  center is `center`: every cell surely a cube color. */
function faceColors(cells: readonly CellSample[], center: number, color: Color): string | null {
  const middle = cells[center] && guessColor(cells[center].lab).color
  if (!middle || !(LOOKS_LIKE[color] ?? [color]).includes(middle)) return null
  const guesses = cells.map((cell) => guessColor(cell.lab))
  return guesses.every((g) => g.sure) ? guesses.map((g) => g.color).join('') : null
}

/** Whether a picture shows the face whose center is `center`. */
export const showsFace = (cells: readonly CellSample[], center: number, color: Color): boolean =>
  faceColors(cells, center, color) !== null

/** The pictures of the face showing the same colors so far, since when. */
export interface Watch {
  readonly since: number
  readonly colors: string
  readonly frames: readonly (readonly CellSample[])[]
}

export const NO_WATCH: Watch = { since: 0, colors: '', frames: [] }

/** A new picture watched: the face taken (its cells, merged) once its
 *  colors stayed the same long enough, else what is watched now. */
export function watch(
  state: Watch,
  cells: readonly CellSample[],
  now: number,
  center: number,
  color: Color,
): { readonly state: Watch; readonly taken?: CellSample[] } {
  const colors = faceColors(cells, center, color)
  if (!colors) return { state: NO_WATCH }
  if (colors !== state.colors) return { state: { since: now, colors, frames: [cells] } }
  const frames = [...state.frames, cells]
  if (now - state.since < HOLD_MS) return { state: { ...state, frames } }
  return { state: NO_WATCH, taken: mergeSamples(frames) }
}
