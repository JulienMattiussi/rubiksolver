import { joinKey, regionsOf, type Canvas } from './canvas'
import {
  drawingDistance,
  drawingKey,
  sidesOf,
  turnedDistance,
  type FaceEntry,
  type Found,
} from './faceViews'

/**
 * A side asked for (`SIDES`), when a puzzle's four faces leave states of
 * two shapes alike (Meffert's Pocket Cube: its black faces hide what
 * tells them apart, in one position held out of six): the states found
 * told apart by what that side shows, however turned (a camera's picture
 * of it, held some way). Either side always tells them apart (measured
 * 2026-11-04 on its 1 160 shapes held the 24 ways).
 */

/** A blank canvas, `n` cells a side, for the side asked for. */
export const blankCanvas = (n: number): Canvas => ({
  cells: Array.from({ length: n * n }, () => null),
  joins: [],
})

/** A state's side (`side`: its index in `SIDES`), as drawn. */
const sideOf = (found: Found, entry: FaceEntry, side: number) => sidesOf(found, entry.grid)[side]!

/** Whether the states found differ by a side: that side to ask for. */
export function needsSide(found: readonly Found[], entry: FaceEntry, side = 0): boolean {
  const first = found[0]
  if (!first) return false
  const key = sideOf(first, entry, side)
  return found.some((f) => turnedDistance(sideOf(f, entry, side), key) > 0)
}

/** The states found nearest the side a canvas shows, and how far they are
 *  (none while it is not all painted). */
export function bySide(
  found: readonly Found[],
  canvas: Canvas,
  entry: FaceEntry,
  side = 0,
): { readonly found: Found[]; readonly off: number } {
  const regions = regionsOf(canvas)
  if (!regions || !found.length) return { found: [], off: Infinity }
  const read = drawingKey(regions, entry.canvas)
  const far = found.map((f) => turnedDistance(read, sideOf(f, entry, side)))
  const off = Math.min(...far)
  return { found: found.filter((_, i) => far[i] === off), off }
}

/** A canvas turned a quarter clockwise. */
function quarterOf(canvas: Canvas): Canvas {
  const n = Math.round(Math.sqrt(canvas.cells.length))
  const to = (i: number) => (i % n) * n + (n - 1 - Math.floor(i / n))
  const cells = [...canvas.cells]
  canvas.cells.forEach((cell, i) => (cells[to(i)] = cell))
  return {
    cells,
    joins: canvas.joins.map((key) => {
      const [a, b] = key.split('-').map(Number) as [number, number]
      return joinKey(to(a), to(b))
    }),
  }
}

/** The side a canvas shows, turned as a state draws it (the turn that
 *  differs least): its colors then paint that state's stickers. */
export function asDrawn(found: Found, canvas: Canvas, entry: FaceEntry, side = 0): Canvas {
  const theirs = sideOf(found, entry, side)
  let best = canvas
  let far = Infinity
  for (let k = 0, turned = canvas; k < 4; k++, turned = quarterOf(turned)) {
    const regions = regionsOf(turned)
    const d = regions ? drawingDistance(drawingKey(regions, entry.canvas), theirs) : Infinity
    if (d < far) [best, far] = [turned, d]
  }
  return best
}
