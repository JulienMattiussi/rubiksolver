import { guessColor, TWINS } from './color'
import type { ScanFace } from './plan'
import { mergeSamples, type CellSample } from './sample'
import type { Color } from '../../core/types'

/**
 * When to take a face (pure): the picture shows it once every cell of the
 * frame is surely some cube color and its center, if it has one, is the
 * face asked for; it is taken once the colors read stayed the same for two
 * seconds, which says the cube was framed and held still enough, the
 * pictures of those two seconds merged. No closer aim nor stillness is
 * asked: a cell read across two stickers, or a hand that shakes, changes
 * the colors read. The face taken just before is not taken again until the
 * picture changed: without a center (an even cube), nothing else tells two
 * faces apart. Nor does anything tell a wall or a ceiling, all white, from
 * a white face: on an even cube, a face all white is taken only as the
 * last one to take (the others then told it).
 */

/** How long the colors read must stay the same, in milliseconds. */
export const HOLD_MS = 2000

/** A color, twins alike (red and orange: color.ts). */
const family = (color: Color | null): Color | null =>
  color && (TWINS as readonly Color[]).includes(color) ? TWINS[0]! : color

/** The colors guessed, cell by cell, twins alike (a cell between red and
 *  orange holds still all the same). */
const colorsOf = (cells: readonly CellSample[]): string =>
  cells.map((cell) => family(guessColor(cell.lab).color) ?? '-').join('')

/** The colors a picture shows, cell by cell, if it shows the face asked
 *  for: every cell surely a cube color, its center that face's; all white
 *  without a center, only as the `last` face to take. */
function faceColors(cells: readonly CellSample[], face: ScanFace, last = true): string | null {
  const center = face.center !== null ? cells[face.center] : undefined
  if (face.center !== null) {
    const middle = center && guessColor(center.lab).color
    if (!middle || family(middle) !== family(face.frontColor)) return null
  }
  if (cells.length !== face.cells.length) return null
  if (!cells.every((cell) => guessColor(cell.lab).sure)) return null
  const colors = colorsOf(cells)
  return face.center === null && !last && /^W+$/.test(colors) ? null : colors
}

/** Whether a picture shows the face asked for. */
export const showsFace = (cells: readonly CellSample[], face: ScanFace): boolean =>
  faceColors(cells, face) !== null

/** The pictures of the face showing the same colors so far, since when,
 *  and the colors of the face taken before while the picture still shows
 *  them. */
export interface Watch {
  readonly since: number
  readonly colors: string
  readonly frames: readonly (readonly CellSample[])[]
  readonly before: string
}

/** A face watched for, after this one taken (if any). */
export const watchAfter = (taken?: readonly CellSample[]): Watch => ({
  since: 0,
  colors: '',
  frames: [],
  before: taken ? colorsOf(taken) : '',
})

/** A new picture watched, of the face asked for (the `last` one to take,
 *  or not): the face taken (its cells, merged) once its colors stayed the
 *  same long enough, else what is watched now. */
export function watch(
  state: Watch,
  cells: readonly CellSample[],
  now: number,
  face: ScanFace,
  last: boolean,
): { readonly state: Watch; readonly taken?: CellSample[] } {
  const colors = faceColors(cells, face, last)
  // Still the face taken before: the cube has not turned yet.
  if (colors && colors === state.before) return { state }
  if (!colors) return { state: watchAfter() }
  if (colors !== state.colors)
    return { state: { ...watchAfter(), since: now, colors, frames: [cells] } }
  const frames = [...state.frames, cells]
  if (now - state.since < HOLD_MS) return { state: { ...state, frames } }
  return { state: watchAfter(), taken: mergeSamples(frames) }
}
