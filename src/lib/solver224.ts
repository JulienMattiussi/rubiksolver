import { applyMove, applyMoves, cubeDims, facesUniform, isBoxed, isSolved, solvedCube, stateKey } from './cube'
import { movesFor, parseMoves } from './moves'
import { searchSequences } from './solverKit'
import type { Cube, Cubie, Move, Vec3 } from './types'

/**
 * 2x2x4 tower solver, following the method taught on fan2cube.fr: put the
 * shape back, finish the inner Pocket, finish the outer Pocket. A tower is
 * two 2x2x2 stacked, and that is how it is solved.
 *
 * The tower is the app's first shape that leaves its own box. Its long axis
 * has a square section, so it takes quarter turns; the two short axes only fit
 * half turns, yet their quarter turns keep every piece on the grid (all three
 * dimensions are even), so the puzzle happily does them and comes out bumpy.
 *
 * One invariant frames everything. A quarter turn swaps two coordinates up to
 * sign, so the multiset {|x|, |y|, |z|} of a piece never changes:
 * - the eight middle pieces are {1,1,1} and can never leave the box;
 * - the eight corners are {1,1,3} and stick out exactly when their 3 lands on
 *   x or z, which is what makes the shape shift.
 *
 * Leaving the box has a second effect, the one that makes this puzzle its own
 * beast: a piece can come back tipped over, showing an unstickered face where
 * a color belongs. No turn that stays in the box can fix that, which is why
 * the method spends a whole phase on the shape before touching the Pockets.
 */

const SOLVED = solvedCube('224')

/** Every turn of a tower (its long axis also has inner slices and wide turns). */
const ALL_MOVES = movesFor('224')

/** Turns that keep the puzzle in its box: a quarter turn about a short axis
 *  pushes the tall corners out, everything else is safe. */
const BOX_MOVES = ALL_MOVES.filter((m) => isBoxed(applyMove(SOLVED, m)))

const isCorner = (c: Cubie): boolean => c.stickers.length === 3
const isMiddle = (c: Cubie): boolean => c.stickers.length === 2

/** A middle piece is tipped when one of its stickers faces up or down: those
 *  faces are hidden inside the tower, so the puzzle shows a blank facelet. */
const isTipped = (c: Cubie): boolean => isMiddle(c) && c.stickers.some((s) => s.normal[1] !== 0)

/** Dedup keys projected on the pieces a phase cares about. Cubies keep their
 *  array index through a move, so no sorting is needed. */
const cornerKey = (cube: Cube): string => stateKey(cube.filter(isCorner))
const middleKey = (cube: Cube): string => stateKey(cube.filter(isMiddle))

// ---------------------------------------------------------------------------
// Phase I: the shape
// ---------------------------------------------------------------------------

const cellKey = (p: Vec3): string => p.join(',')

/** The 24 cells a corner can reach: the grid points holding exactly one 3. */
const CORNER_CELLS: readonly Vec3[] = [-3, -1, 1, 3].flatMap((x) =>
  [-3, -1, 1, 3].flatMap((y) =>
    [-3, -1, 1, 3]
      .map((z): Vec3 => [x, y, z])
      .filter((p) => p.filter((v) => Math.abs(v) === 3).length === 1),
  ),
)

const CELL_INDEX = new Map(CORNER_CELLS.map((p, i) => [cellKey(p), i]))

/** Where a turn sends one cell, read off a probe piece parked on it. */
function cellAfter(cell: Vec3, move: Move): Vec3 {
  const probe: Cube = SOLVED.map((c, i) => (i === 0 ? { ...c, position: cell } : c))
  return applyMove(probe, move)[0]!.position
}

/** Where each turn sends every corner cell. Whether a cell belongs to a turn's
 *  slab depends on the cell alone, so this is a fixed permutation - which is
 *  what turns the shape search into bit shuffling. */
const CELL_PERMS: readonly Uint8Array[] = ALL_MOVES.map((move) => {
  const perm = new Uint8Array(CORNER_CELLS.length)
  CORNER_CELLS.forEach((cell, i) => {
    perm[i] = CELL_INDEX.get(cellKey(cellAfter(cell, move)))!
  })
  return perm
})

const cornerCells = (cube: Cube): number =>
  cube
    .filter(isCorner)
    .reduce((mask, c) => mask | (1 << CELL_INDEX.get(cellKey(c.position))!), 0)

/** The eight cells a solved tower's corners occupy. */
const BOXED_MASK = cornerCells(SOLVED)

/** Mask after a turn: move each set bit where the turn's permutation points. */
function turnMask(mask: number, perm: Uint8Array): number {
  let out = 0
  for (let i = 0; i < perm.length; i++) if (mask & (1 << i)) out |= 1 << perm[i]!
  return out
}

let DISTANCES: Uint8Array | null = null

/**
 * Turns from every reachable footprint back to the box, by one breadth-first
 * sweep over the 735471 of them (24 cells to choose 8 from, and the sweep does
 * reach them all). Computed once, on the first tower solved.
 */
function shapeDistances(): Uint8Array {
  if (DISTANCES) return DISTANCES
  const dist = new Uint8Array(1 << CORNER_CELLS.length).fill(255)
  dist[BOXED_MASK] = 0
  let frontier = [BOXED_MASK]
  for (let depth = 1; frontier.length; depth++) {
    const next: number[] = []
    for (const mask of frontier) {
      for (const perm of CELL_PERMS) {
        const turned = turnMask(mask, perm)
        if (dist[turned] !== 255) continue
        dist[turned] = depth
        next.push(turned)
      }
    }
    frontier = next
  }
  DISTANCES = dist
  return dist
}

/** Put the tower back in its box, one turn closer at a time. The distance map
 *  makes this optimal and immediate: every state has a turn that lowers it. */
function restoreBox(cube: Cube): Move[] {
  const dist = shapeDistances()
  const moves: Move[] = []
  let mask = cornerCells(cube)
  let left = dist[mask]!
  if (left === 255) throw new Error('solve224: unreachable footprint')
  while (left > 0) {
    const step = ALL_MOVES.findIndex((_, i) => dist[turnMask(mask, CELL_PERMS[i]!)] === left - 1)
    if (step < 0) throw new Error('solve224: stuck restoring the shape')
    moves.push(ALL_MOVES[step]!)
    mask = turnMask(mask, CELL_PERMS[step]!)
    left--
  }
  return moves
}

/**
 * "Pivoter 2 sommets": the method's own formula, which tips two pieces back
 * without moving anything else. Written in the app's notation (their D is our
 * R, their B our D, their * a wide turn).
 */
const PIVOT = parseMoves("R' Dw R F Dw F' Uw' F Dw' F' R' Dw' R Uw")

/** The pivot, seen from each of the four sides and from either end, so any
 *  pair of tipped pieces can be brought under it. */
const PIVOTS: readonly (readonly Move[])[] = ALL_MOVES.filter(
  (m) => !m.depth && (m.face === 'U' || m.face === 'D'),
).flatMap((align) => [
  [align, ...PIVOT],
  [...PIVOT, align],
])

/** How many middle pieces show a blank facelet. */
const tippedCount = (cube: Cube): number => cube.filter(isTipped).length

/**
 * Set the tipped pieces back on their feet, keeping the box. Searched over the
 * method's pivot formula: the key counts what is left to fix, so the space
 * stays tiny.
 */
function untip(cube: Cube): Move[] {
  if (tippedCount(cube) === 0) return []
  return searchSequences(
    cube,
    (c) => tippedCount(c) === 0 && isBoxed(c),
    [...PIVOTS, ...BOX_MOVES.map((m) => [m])],
    6,
    (c) => `${tippedCount(c)}:${middleKey(c)}`,
  )
}

/** Phase I: the tower is a box again, with every piece the right way up. */
export function solveShape224(cube: Cube): Move[] {
  const box = restoreBox(cube)
  const state = applyMoves(cube, box)
  return [...box, ...untip(state)]
}

// ---------------------------------------------------------------------------
// Phases II and III: the two Pockets
// ---------------------------------------------------------------------------

/** Inner Pocket: the eight middle pieces, moved by sequences that put the
 *  corners back where they found them. */
const INNER_GENERATORS: readonly (readonly Move[])[] = (() => {
  const rings = ALL_MOVES.filter((m) => m.depth && !m.wide)
  const swaps = BOX_MOVES.filter(
    (m) => m.amount === 2 && !m.depth && m.face !== 'U' && m.face !== 'D',
  )
  return [...rings.map((m) => [m]), ...swaps.flatMap((s) => rings.map((m) => [s, m, s]))]
})()

/** Phase II: finish the inner Pocket, leaving the outer one alone. */
export function solveInnerPocket224(cube: Cube): Move[] {
  return searchSequences(cube, (c) => facesUniform(c.filter(isMiddle)), INNER_GENERATORS, 9, middleKey)
}

/** Phase III: finish the outer Pocket. Turns that keep the box reach all 8!
 *  corner arrangements, so this never has to leave it again. */
export function solveOuterPocket224(cube: Cube): Move[] {
  return searchSequences(
    cube,
    (c) => isSolved(c),
    BOX_MOVES.map((m) => [m]),
    15,
    cornerKey,
  )
}

/** Whether a cube is a tower (the solver's own shape). */
export function isTower(cube: Cube): boolean {
  const dims = cubeDims(cube)
  return dims[0] === 2 && dims[1] === 4 && dims[2] === 2
}
