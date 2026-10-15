import { solvedCube } from '../core/cube'
import { invertMoves } from '../core/moves'
import { applyMoves } from '../core/turn'
import { cutsToBox, FASHION_CELLS } from '../methods/twisted/fashionShape'
import type { Cube, CubeShape, Cubie, Vec3 } from '../core/types'

/**
 * Entering the Fashion-V where its halves stand (lib/puzzles/twisted/
 * fashion.ts), before its colors: cell by cell, a click goes through the
 * ways its halves can stand. A corner's pair is cut across one of the three
 * axes; an edge's across one of its cell's two (lying, or standing), or the
 * cell holds a whole equator edge instead. The form is then a state with
 * those cuts, found by the shape search (fashionShape.ts): none if no turn
 * reaches them.
 */

/** Per cell (its signs, `'1,1,0'`): the axis its halves are cut across, or
 *  9 for a whole edge. */
export type Cuts = Readonly<Record<string, number>>

const WHOLE = 9
const key = (cell: Vec3) => cell.join()

/** Whether a puzzle is entered so, its halves first. */
export const entersCuts = (shape: CubeShape): boolean => shape === 'fashion'

/** In the box: every pair lying (cut across the vertical), the whole edges
 *  in the equator. */
export function boxCuts(): Cuts {
  return Object.fromEntries([
    ...FASHION_CELLS.corners.map((c) => [key(c), 1]),
    ...FASHION_CELLS.edges.map((c) => [key(c), c[1] === 0 ? WHOLE : 1]),
  ])
}

const cellOf = (p: Vec3): Vec3 => p.map(Math.sign) as unknown as Vec3

/** The cuts of a state: each cell's outer half says its axis; a cell
 *  without one holds a whole edge. */
export function cutsOf(cube: Cube): Cuts {
  const cuts: Record<string, number> = Object.fromEntries([
    ...FASHION_CELLS.corners.map((c) => [key(c), WHOLE]),
    ...FASHION_CELLS.edges.map((c) => [key(c), WHOLE]),
  ])
  for (const c of cube) {
    const axis = c.position.findIndex((v) => Math.abs(v) === 2)
    const cell = key(cellOf(c.position))
    if (axis >= 0 && cell in cuts) cuts[cell] = axis
  }
  return cuts
}

/** The ways a cell's halves can stand, in click order. */
function waysOf(cell: Vec3): number[] {
  const across = [0, 1, 2].filter((a) => cell[a] !== 0)
  return across.length === 3
    ? [1, 0, 2]
    : [...across.sort((a, b) => (a === 1 ? -1 : b === 1 ? 1 : a - b)), WHOLE]
}

/** A cell clicked: its halves the next way round. */
export function nextCut(cuts: Cuts, cellKey: string): Cuts {
  const cell = cellKey.split(',').map(Number) as unknown as Vec3
  const ways = waysOf(cell)
  const now = ways.indexOf(cuts[cellKey] ?? ways[0]!)
  return { ...cuts, [cellKey]: ways[(now + 1) % ways.length]! }
}

/** How many cells hold a whole edge (four, in any form). */
export const wholeCount = (cuts: Cuts): number =>
  FASHION_CELLS.edges.filter((c) => cuts[key(c)] === WHOLE).length

/** A neutral piece at `position`, a sticker on each of `faces` (a side's
 *  color: a top or bottom one would tell its drawing which way it is thin,
 *  which its place says here). */
const piece = (position: Vec3, faces: number[]): Cubie => ({
  position,
  stickers: faces.map((a) => {
    const normal = [0, 0, 0]
    normal[a] = Math.sign(position[a]!)
    return { normal: normal as unknown as Vec3, color: 'G' }
  }),
})

/** The pieces as the cuts lay them, to be seen while entered: each pair's
 *  halves (the outer one on every face of its cell, the inner one on all
 *  but its cut), a whole edge filling its cell, and the centers. */
export function cutPieces(cuts: Cuts): Cube {
  const centers = solvedCube('fashion').filter(
    (c) => c.stickers.length === 1 && c.position.filter((v) => v !== 0).length === 1,
  )
  const cells = [...FASHION_CELLS.corners, ...FASHION_CELLS.edges]
  return [
    ...centers,
    ...cells.flatMap((cell): Cube => {
      const faces = [0, 1, 2].filter((a) => cell[a] !== 0)
      const cut = cuts[key(cell)]!
      if (cut === WHOLE) return [piece(cell, faces)]
      const at = (k: number) => cell.map((v, a) => (a === cut ? v * k : v)) as unknown as Vec3
      return [
        piece(at(2), faces),
        piece(
          at(1),
          faces.filter((a) => a !== cut),
        ),
      ]
    }),
  ]
}

/** A state with these cuts (where its pieces stand), from the box by the
 *  blocks, or null if they cannot stand so. */
export function formOfCuts(cuts: Cuts): Cube | null {
  if (wholeCount(cuts) !== 4) return null
  const moves = cutsToBox(
    FASHION_CELLS.edges.map((c) => cuts[key(c)]!),
    FASHION_CELLS.corners.map((c) => cuts[key(c)]!),
  )
  return moves && applyMoves(solvedCube('fashion'), invertMoves(moves))
}
