import { FACE_COLOR, solvedCube } from '../../core/cube'
import { isMark } from '../../core/types'
import { AXIS_ROTATIONS, FACE_NORMAL, faceOfNormal, normalIndex, vecKey } from '../../core/geometry'
import { formatMoves, invertMoves, parseMoves } from '../../core/moves'
import { moveSet, OUTER_TURNS } from '../../core/moveSet'
import { colorsOf, homesOf, withStickers } from '../../core/pieces'
import { applyMove, applyMoves } from '../../core/turn'
import { arrowOn, faceWays, latchTurns } from '../../puzzles/twisted/latch'
import { solvePieces } from '../../solve/pieceSearch'
import { cycleTable, placeByCycles, uniqueHomes } from '../../solve/cycleTable'
import { atEverySide, type MethodPlan } from '../../solve/solverKit'
import { conjugated } from '../../solve/everyWay'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import {
  CYCLE,
  CYCLE_BACK,
  PLACE_LEFT,
  PLACE_RIGHT,
  RAISE,
  TURN_OVER,
  TURN_TWO,
} from '../holey/tori'
import { once } from '../../solve/once'

/**
 * Latch Cube, "les arêtes d'abord": its faces lock with arrows of both
 * kinds on them, and the arrows ride on the edges, so the edges decide
 * every turn. A face that is not locked turns either way: the way its
 * arrows forbid is played as three quarters the other way (fan2cube.fr's
 * "D' = D3"). So a search only asks which faces are locked, which the
 * edges alone say:
 *
 *   1. The edges    one at a time, the corners let be: a search over the
 *                   twelve edges (their arrows say which faces go), helped
 *                   by the Tori's formulas (the 3x3 without its corners,
 *                   tori.ts) once the bottom cross stands
 *   2. The corners  placed by the page's 3-cycle (HGP) -> (HAG) -> (HPD) =
 *                   [DH].G'[HD]G, then turned by (HGP)-(HAG)+ =
 *                   [DH]².G'[HD]²G: with the edges home, their arrows
 *                   stand as solved at the start of every formula, so the
 *                   variants that go (each held every way and set up by a
 *                   turn or two) are sorted out once
 *
 * Notation (page -> app): H B A P G D = U D F B L R, [X Y] = X Y X' Y'.
 * Each formula's effect is asserted in tests/unit/puzzles/twisted/latch.test.ts.
 */

/** (HGP) -> (HAG) -> (HPD) = [DH] .G'[HD]G */
export const CORNER_CYCLE = "R U R' U' L' U R U' R' L"
/** (HGP)-(HAG)+ = [DH]² .G'[HD]²G */
export const CORNER_TWIST = "R U R' U' R U R' U' L' U R U' R' U R U' R' L"

const SOLVED = solvedCube('latch')
const isEdge = withStickers(2)
const isCorner = withStickers(3)
const EDGES = homesOf('latch', isEdge)

/** Whether a face is locked: arrows of both kinds on it (faceWays reads
 *  any pieces, the tracked edges alone too). */
const locked = (pieces: Cube, face: Face) => {
  const { cw, ccw } = faceWays(pieces, face)
  return !cw && !ccw
}

/** A turn goes, its way aside, when its face is not locked (turning a face
 *  keeps its arrows on it: the same both ways). */
const unlocked = (pieces: readonly Cubie[], move: Move) => !locked(pieces, move.face)

/** Each quarter turned the way its face goes now (X' as X X X). */
function played(cube: Cube, moves: readonly Move[]): Move[] {
  let state = cube
  const out: Move[] = []
  for (const move of moves) {
    const ways = latchTurns(state, move)
      ? [move]
      : [1, 2, 3].map((): Move => ({ face: move.face, amount: move.amount === 1 ? 3 : 1 }))
    for (const m of ways) state = applyMove(state, m)
    out.push(...ways)
  }
  return out
}

/** The arrows' pattern: for each edge slot, which way the arrows on each of
 *  its two faces go (what decides the locks from here on). */
const arrowPattern = (pieces: readonly Cubie[]) =>
  pieces
    .filter(isEdge)
    .map(
      (c) =>
        `${vecKey(c.position)}${c.stickers.map((s) => `${normalIndex(s.normal)}${arrowOn(c, s) ?? '-'}`).join('')}`,
    )
    .sort()
    .join('|')

const right = (c: Cubie) => c.stickers.every((s) => s.color === FACE_COLOR[faceOfNormal(s.normal)])

/** A formula from every side (H above), and the way back. */
const fromEverySide = (formulas: readonly (readonly Move[])[]) =>
  formulas.flatMap((f) => {
    const sides = atEverySide(formatMoves(f))
    return [...sides, ...sides.map((m) => invertMoves(m))]
  })

/** The Tori's formulas (the 3x3 without its corners) that keep the bottom
 *  cross: an edge brought into the middle layer, or turned over there. */
const MIDDLE = fromEverySide([RAISE, PLACE_LEFT, PLACE_RIGHT, TURN_OVER])
/** Those that keep the first two layers: the top edges turned over, or
 *  cycled. */
const TOP = fromEverySide([TURN_TWO, CYCLE, CYCLE_BACK])
const U_TURNS = moveSet('U')

/** Whether these edges are home. */
const edgesAt = (homes: readonly Vec3[]) => {
  const at = new Set(homes.map(vecKey))
  return (pieces: readonly Cubie[]) =>
    pieces.every(
      (c, i) =>
        !at.has(vecKey(EDGES[i]!)) || (vecKey(c.position) === vecKey(EDGES[i]!) && right(c)),
    )
}

/** A way of holding the cube: each face's turns as those of the face it
 *  brings there. */
interface Holding {
  readonly move: (m: Move) => Move
}

const HOLDINGS: Holding[] = AXIS_ROTATIONS.map((turn) => ({
  move: (m) => ({ ...m, face: faceOfNormal(turn(FACE_NORMAL[m.face])) }),
}))

/** A search over the twelve edges (their arrows say which faces go), for
 *  `homes` to be home: by `turns` and `macros` (the Tori's way); none past
 *  `maxDepth`. */
function placeEdges(
  cube: Cube,
  homes: readonly Vec3[],
  turns: Move[],
  macros: Move[][],
  maxDepth: number,
): Move[] {
  const at = new Set(homes.map(vecKey))
  return solvePieces<Move>(cube, {
    track: EDGES,
    moves: { generators: turns, turns },
    macros,
    legal: (pieces, turn) => unlocked(pieces, turn as Move),
    goal: edgesAt(homes),
    key: (pieces) =>
      `${pieces
        .filter((_, i) => at.has(vecKey(EDGES[i]!)))
        .map((c) => vecKey(c.position) + c.stickers.map((s) => normalIndex(s.normal)).join(''))
        .join(';')}#${arrowPattern(pieces)}`,
    maxDepth,
  })
}

/** The edges held one way: the bottom cross one at a time (any turn), each
 *  middle edge (by the top's turns and the Tori's formulas, with `fallback`
 *  any turn if the locks stand in the way), then the top ones together (by
 *  the top's turns and formulas); null when the locks stop it. */
function edgesHeld(cube: Cube, holding: Holding, fallback: boolean): Move[] | null {
  const homes = [...EDGES].sort((a, b) => heightAs(holding, a) - heightAs(holding, b))
  const all = (OUTER_TURNS.turns as Move[]).map(holding.move)
  const top = (U_TURNS.turns as Move[]).map(holding.move)
  const middle = MIDDLE.map((f) => f.map(holding.move))
  const last = TOP.map((f) => f.map(holding.move))
  const stages: [number, Move[], Move[][], number][] = [
    [1, all, [], 6],
    [2, all, [], 6],
    [3, all, [], 6],
    [4, all, [], 6],
    [5, top, middle, 6],
    [6, top, middle, 6],
    [7, top, middle, 6],
    [8, top, middle, 6],
    [12, top, last, 8],
  ]
  let state = cube
  const moves: Move[] = []
  for (const [k, turns, macros, depth] of stages) {
    const goal = homes.slice(0, k)
    let found: Move[] | undefined
    const tries: [Move[], Move[][], number][] = [[turns, macros, depth]]
    if (fallback) tries.push([all, macros, 5])
    for (const [t, m, d] of tries) {
      try {
        found = placeEdges(state, goal, t, m, d)
        break
      } catch {
        // The locks in the way: any turn (on the second pass), then give up.
      }
    }
    if (!found) return null
    const real = played(state, found)
    state = applyMoves(state, real)
    moves.push(...real)
  }
  return moves
}

/** How high an edge's home stands as the cube is held (along the face it
 *  brings up). */
const heightAs = (holding: Holding, p: Vec3) => {
  const up = FACE_NORMAL[holding.move({ face: 'U', amount: 1 }).face]
  return p[0] * up[0] + p[1] * up[1] + p[2] * up[2]
}

/** The edges, the corners let be: held the first way the locks let
 *  through, the Tori's way first, any turn where they stand in its way. */
function solveEdges(cube: Cube): Move[] {
  for (const fallback of [false, true]) {
    for (const holding of HOLDINGS) {
      const moves = edgesHeld(cube, holding, fallback)
      if (moves) return moves
    }
  }
  throw new Error('latch: the locks stop every way of holding it')
}

/** Every variant of a formula that goes from the edges home: held every
 *  way, set up by up to two turns (undone after). */
function variants(formula: string): Move[][] {
  const base = parseMoves(formula)
  const held = HOLDINGS.map((h) => base.map(h.move)).flatMap((f) => [f, invertMoves(f)])
  const singles = OUTER_TURNS.turns as Move[]
  const setups: Move[][] = [
    [],
    ...singles.map((m) => [m]),
    ...singles.flatMap((a) => singles.filter((b) => b.face !== a.face).map((b) => [a, b])),
  ]
  return conjugated(held, setups).filter((seq) => goes(SOLVED, seq))
}

/** Whether a sequence goes from `cube`, no face locked on the way. */
function goes(cube: Cube, moves: readonly Move[]): boolean {
  let state = cube
  for (const m of moves) {
    if (locked(state, m.face)) return false
    state = applyMove(state, m)
  }
  return true
}

const CORNERS = homesOf('latch', isCorner)

/** Every 3-cycle of corners that goes, the shortest of each. */
const cornerCycles = once(() =>
  cycleTable(
    SOLVED,
    isCorner,
    variants(CORNER_CYCLE).sort((a, b) => a.length - b.length),
    [],
  ),
)

/** Each corner sent to the slot of its colors. */
const cornerHomes = uniqueHomes(SOLVED, isCorner)

/** The twists that go, one of each effect (the corners stay in place). */
let twists: Move[][] | undefined
function twistMacros(): Move[][] {
  if (twists) return twists
  const seen = new Set<string>()
  twists = variants(CORNER_TWIST)
    .sort((a, b) => a.length - b.length)
    .filter((seq) => {
      const look = applyMoves(SOLVED, seq)
        .filter(isCorner)
        .map((c) => vecKey(c.position) + c.stickers.map((s) => s.normal.join()).join())
        .join('|')
      if (seen.has(look)) return false
      seen.add(look)
      return true
    })
  return twists
}

const edgesHome = (cube: Cube) => cube.filter(isEdge).every(right)

export const LATCH_PLAN: MethodPlan = [
  { key: 'stepLatchEdges', goal: edgesHome, moves: OUTER_TURNS, phases: [solveEdges] },
  {
    key: 'stepLatchCorners',
    goal: (cube) =>
      edgesHome(cube) &&
      cube
        .filter(isCorner)
        .every((c) =>
          SOLVED.some(
            (h) => vecKey(h.position) === vecKey(c.position) && colorsOf(h) === colorsOf(c),
          ),
        ),
    moves: OUTER_TURNS,
    phases: [(cube) => played(cube, placeByCycles(cube, cornerCycles(), cornerHomes))],
  },
  {
    key: 'stepLatchTwist',
    goal: (cube) => cube.every((c) => c.stickers.every((s) => isMark(s) || right(c))),
    moves: OUTER_TURNS,
    phases: [
      (cube) =>
        played(
          cube,
          solvePieces<Move>(cube, {
            track: CORNERS,
            moves: { generators: [], turns: [] },
            macros: twistMacros(),
            maxDepth: 6,
          }),
        ),
    ],
  },
]
