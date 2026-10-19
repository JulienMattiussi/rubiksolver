import { FACE_COLOR, solvedCube } from '../../core/cube'
import { homeAt, homesOf, recolored, withStickers } from '../../core/pieces'
import { invertMoves } from '../../core/moves'
import { parseMoves } from '../../core/notation'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import { applyMoves } from '../../core/turn'
import { atEverySide, projectPlan, type MethodPlan } from '../../solve/solverKit'
import { solvePieces } from '../../solve/pieceSearch'
import type { Color, Cube, Face, Move, Vec3 } from '../../core/types'
import { frame2 } from '../standard/cube2'
import { BEGINNER_PLAN, secondLayerDone } from '../standard/layers3'
import { regular } from './voidFrames'
import { INSERT_RIGHT } from '../standard/algs'

/**
 * Void Cube, as taught on fan2cube.fr (voidcube2): "comme un Rubik's Cube",
 * the colors of its missing centers found first. Like the 2x2's, its frame
 * is the corner at DBL (cube2.ts): the puzzle is read as the 3x3 it would
 * be with that corner's centers, its colors renamed to the standard ones.
 *
 *   1. The bottom corners  "comme le Pocket", by [DH] from each side
 *   2. The bottom edges    (HA) -> (BA) = [Hd], (HA)° = dHd'H, an equator
 *                          edge raised by [HD][H'A']
 *   3. The middle edges    as a 3x3's
 *   4. The singularity     two edges to swap, a state a 3x3 never reaches
 *                          (a slice turns its edges, not its centers):
 *                          X = (aH)²(aH')²aH²(aH')² swaps (HA) and (HD)
 *   5. The top             as a 3x3's
 *
 * Notation (page -> app): H B A P G D = U D F B L R, d a = 2R 2F (the
 * slices next to D and A, turned as they are); [X Y] = X Y X' Y'. Each
 * formula's effect is asserted in tests/unit/puzzles/holey/voidCube.test.ts.
 */

/** (HDA) -> (BAD): [DH] */
export const DOWN_CORNER = "R U R' U'"
/** (HA) -> (BA): [Hd] */
export const DOWN_EDGE = "U 2R U' 2R'"
/** (HA)°: dHd'H */
export const FLIP_EDGE = "2R U 2R' U"
/** (AD) -> top: [HD][H'A'] */
export const RAISE_EDGE = INSERT_RIGHT
/** (HA) <-> (HD): (aH)²(aH')²aH²(aH')² */
export const SWAP_EDGES = "2F U 2F U 2F U' 2F U' 2F U2 2F U' 2F U'"

const CENTERS = solvedCube('3').filter((c) => c.stickers.length === 1)

/** The 3x3 the Void Cube is, framed by its corner at DBL: each color
 *  renamed to the standard one of the face it stands for, the centers
 *  added. */
function asCube(cube: Cube): Cube {
  const frame = frame2(cube)
  const rename = new Map<Color, Color>(
    (Object.keys(frame) as Face[]).map((f) => [frame[f], FACE_COLOR[f]]),
  )
  return [...recolored(cube, rename), ...CENTERS]
}

const TURNS = allTurnsOf('void')
/** H aligns the pieces under the formulas. */
const H = moveSet('U')

const isCorner = withStickers(3)
const isEdge = withStickers(2)
const BOTTOM_CORNERS = homesOf('3', (c) => isCorner(c) && c.position[1] < 0)
const BOTTOM_EDGES = homesOf('3', (c) => isEdge(c) && c.position[1] < 0)
const home = (positions: readonly Vec3[]) => (cube: Cube) => homeAt(cube, positions, '3')

/** A middle slice named by the face it turns like among R, U and F (as
 *  the 3x3's turns are): `2L` is `2R'`. */
const NAMED: Partial<Record<Face, Face>> = { L: 'R', D: 'U', B: 'F' }
const named = (moves: readonly Move[]): Move[] =>
  moves.map((m) => {
    const face = m.depth === 2 && !m.wide ? NAMED[m.face] : undefined
    return face ? { ...m, face, amount: (4 - m.amount) as Move['amount'] } : m
  })

/** These pieces placed one after another, each by the fewest formulas
 *  (from each side, aligned by H; `back`: undone too), those before kept. */
function oneByOne(
  positions: readonly Vec3[],
  formulas: readonly string[],
  maxDepth: number,
  back = true,
) {
  const algs = formulas
    .flatMap((f) => [...atEverySide(f), ...(back ? atEverySide(f).map(invertMoves) : [])])
    .map(named)
  return (cube: Cube): Move[] => {
    let state = cube
    const all: Move[] = []
    positions.forEach((_, k) => {
      const moves = solvePieces(state, {
        track: positions.slice(0, k + 1),
        moves: H,
        macros: algs,
        maxDepth,
      })
      state = applyMoves(state, moves)
      all.push(...moves)
    })
    return all
  }
}

/** The plan, worked out on the 3x3 the Void Cube is (`asCube`). */
const OWN: MethodPlan = [
  {
    key: 'stepBottomCorners',
    goal: home(BOTTOM_CORNERS),
    moves: TURNS,
    phases: [oneByOne(BOTTOM_CORNERS, [DOWN_CORNER], 12, false)],
  },
  {
    key: 'stepBottomCross',
    goal: home([...BOTTOM_CORNERS, ...BOTTOM_EDGES]),
    moves: TURNS,
    phases: [
      oneByOne([...BOTTOM_CORNERS, ...BOTTOM_EDGES], [DOWN_EDGE, FLIP_EDGE, RAISE_EDGE], 10),
    ],
  },
  BEGINNER_PLAN[2]!,
  {
    key: 'stepVoidSingularity',
    goal: (cube) => secondLayerDone(cube) && regular(cube),
    moves: TURNS,
    phases: [(cube) => (regular(cube) ? [] : parseMoves(SWAP_EDGES))],
  },
  ...BEGINNER_PLAN.slice(3),
]

export const VOID_CUBE_PLAN: MethodPlan = projectPlan(OWN, asCube).map((spec) => ({
  ...spec,
  moves: TURNS,
}))
