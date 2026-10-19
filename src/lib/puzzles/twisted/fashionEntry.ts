import { solvedCube } from '../../core/cube'
import { invertMoves } from '../../core/moves'
import { applyMoves } from '../../core/turn'
import { cutsToBox, FASHION_CELLS, WHOLE } from '../../methods/twisted/fashionShape'
import type { Cube, Cubie, Vec3 } from '../../core/types'
import { mapVec, parseVecKey, vecKey } from '../../core/geometry'
import type { Cuts, CutsSpec } from '../../editor/entry'

/**
 * How the Fashion-V is entered (lib/editor/entry.ts, its `cuts` step):
 * where its halves stand (fashion.ts), before its colors: cell by cell, a
 * click goes through the
 * ways its halves can stand. A corner's pair is cut across one of the three
 * axes; an edge's across one of its cell's two (lying, or standing), or the
 * cell holds a whole equator edge instead. The form is then a state with
 * those cuts, found by the shape search (fashionShape.ts): none if no turn
 * reaches them.
 */

/* Its cuts, per cell (its signs, `'1,1,0'`): the axis its halves are cut
 * across, or `WHOLE` for a whole edge. */

/** In the box: every pair lying (cut across the vertical), the whole edges
 *  in the equator. */
function boxCuts(): Cuts {
  return Object.fromEntries([
    ...FASHION_CELLS.corners.map((c) => [vecKey(c), 1]),
    ...FASHION_CELLS.edges.map((c) => [vecKey(c), c[1] === 0 ? WHOLE : 1]),
  ])
}

const cellOf = (p: Vec3): Vec3 => mapVec(p, Math.sign)

/** The cuts of a state: each cell's outer half says its axis; a cell
 *  without one holds a whole edge. */
function cutsOf(cube: Cube): Cuts {
  const cuts: Record<string, number> = Object.fromEntries([
    ...FASHION_CELLS.corners.map((c) => [vecKey(c), WHOLE]),
    ...FASHION_CELLS.edges.map((c) => [vecKey(c), WHOLE]),
  ])
  for (const c of cube) {
    const axis = c.position.findIndex((v) => Math.abs(v) === 2)
    const cell = vecKey(cellOf(c.position))
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
function nextCut(cuts: Cuts, cellKey: string): Cuts {
  const cell = parseVecKey(cellKey)
  const ways = waysOf(cell)
  const now = ways.indexOf(cuts[cellKey] ?? ways[0]!)
  return { ...cuts, [cellKey]: ways[(now + 1) % ways.length]! }
}

/** How many cells hold a whole edge (four, in any form). */
const wholeCount = (cuts: Cuts): number =>
  FASHION_CELLS.edges.filter((c) => cuts[vecKey(c)] === WHOLE).length

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
 *  but its cut), a whole edge filling its cell, and the centers (no cell:
 *  they never move). */
function cutPieces(cuts: Cuts): { cubie: Cubie; cell?: string }[] {
  const centers = solvedCube('fashion').filter(
    (c) => c.stickers.length === 1 && c.position.filter((v) => v !== 0).length === 1,
  )
  const cells = [...FASHION_CELLS.corners, ...FASHION_CELLS.edges]
  return [
    ...centers.map((cubie) => ({ cubie })),
    ...cells.flatMap((cell) => {
      const faces = [0, 1, 2].filter((a) => cell[a] !== 0)
      const key = vecKey(cell)
      const cut = cuts[key]!
      if (cut === WHOLE) return [{ cubie: piece(cell, faces), cell: key }]
      const at = (k: number) => mapVec(cell, (v, a) => (a === cut ? v * k : v))
      return [
        { cubie: piece(at(2), faces), cell: key },
        {
          cubie: piece(
            at(1),
            faces.filter((a) => a !== cut),
          ),
          cell: key,
        },
      ]
    }),
  ]
}

/** A state with these cuts (where its pieces stand), from the box by the
 *  blocks, or null if they cannot stand so. */
function formOfCuts(cuts: Cuts): Cube | null {
  if (wholeCount(cuts) !== 4) return null
  const moves = cutsToBox(
    FASHION_CELLS.edges.map((c) => cuts[vecKey(c)]!),
    FASHION_CELLS.corners.map((c) => cuts[vecKey(c)]!),
  )
  return moves && applyMoves(solvedCube('fashion'), invertMoves(moves))
}

/** The Fashion-V's cuts step. */
export const FASHION_CUTS: CutsSpec = {
  start: boxCuts,
  of: cutsOf,
  next: nextCut,
  pieces: cutPieces,
  wholes: wholeCount,
  form: formOfCuts,
}
