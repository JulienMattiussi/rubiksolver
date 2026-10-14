import { isSolved, solvedCube } from '../../core/cube'
import { GHOST_SIDES, isCornerSlot, parseGhostMoves } from '../../puzzles/flat/ghost'
import { invertMoves } from '../../core/moves'
import { allTurnsOf } from '../../core/moveSet'
import { atHome, colorsOf, cubieAt, homesOf } from '../../core/pieces'
import { solvePieces } from '../../solve/pieceSearch'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Cubie, GhostMove } from '../../core/types'

/**
 * Floppy Ghost, "corners then edges", as fan2cube.fr teaches it
 * (floppyghost1): the corners (its "sommets") first, then the edges.
 *
 *   1. Corners placed   3-cycles of corners, (H2 D2)2, brought onto the
 *                       right three by single turns
 *   2. Corners turned   D2 B2 P2 G2 P2 B2 D2 H2 turns over the two top
 *                       corners (and flips the top and left edges, which
 *                       the last step sees to)
 *   3. Edges flipped    two at a time, (H2 D2)3, which flips the top and
 *                       right edges and touches nothing else
 *
 * Each step searches with single turns and its formula as one generator,
 * played from each of the five sides (the mechanism looks the same from
 * each), so a formula is conjugated by the turns that bring it where it is
 * needed. The corners' searches only follow the corners.
 */

/** The formulas, as the page writes them; their effects are asserted in
 *  tests/unit/puzzles/flat/ghost.test.ts. */
export const CYCLE_CORNERS = parseGhostMoves('(H²D²)²')
export const TURN_CORNERS = parseGhostMoves('D²B²P²G² .P² B²D²H²')
export const FLIP_EDGES = parseGhostMoves('(H²D²)^3')

const TURNS = allTurnsOf('ghost')
const isCorner = (c: Cubie) => isCornerSlot(c.position)
const CORNERS = homesOf('ghost', isCorner)
const ALL = homesOf('ghost', () => true)
const SOLVED = solvedCube('ghost')
/** The colors of each corner slot's own corner (corners never share them). */
const SOLVED_CORNERS = CORNERS.map((p) => colorsOf(cubieAt(SOLVED, p)!))

/** Every corner slot holds its own corner, either way up. */
const placed = (cubies: readonly Cubie[]) =>
  CORNERS.every((p, i) => {
    const corner = cubieAt(cubies, p)
    return corner !== undefined && colorsOf(corner) === SOLVED_CORNERS[i]
  })

const turnedRight = (cube: Cube) => cube.filter(isCorner).every((c) => atHome(c, 'ghost'))

/** A formula played from each side (each side's letter moved on by one,
 *  two... sides clockwise), and each undone, as search generators. */
const aroundGhost = (moves: readonly GhostMove[]) =>
  GHOST_SIDES.flatMap((_, r) => {
    const turned = moves.map((m) => ({
      side: GHOST_SIDES[(GHOST_SIDES.indexOf(m.side) + r) % GHOST_SIDES.length]!,
    }))
    return [turned, invertMoves(turned)]
  })

const placeCorners = (cube: Cube) =>
  solvePieces<GhostMove>(cube, {
    track: CORNERS,
    among: isCorner,
    moves: TURNS,
    macros: aroundGhost(CYCLE_CORNERS),
    goal: placed,
    key: (pieces) => pieces.map((p) => p.position.join()).join('|'),
    maxDepth: 8,
  })

const turnCorners = (cube: Cube) =>
  solvePieces<GhostMove>(cube, {
    track: CORNERS,
    among: isCorner,
    moves: TURNS,
    macros: aroundGhost(TURN_CORNERS),
    maxDepth: 10,
  })

const flipEdges = (cube: Cube) =>
  solvePieces<GhostMove>(cube, {
    track: ALL,
    moves: TURNS,
    macros: aroundGhost(FLIP_EDGES),
    maxDepth: 10,
  })

export const GHOST_PLAN: MethodPlan = [
  { key: 'stepGhostCorners', goal: placed, moves: TURNS, phases: [placeCorners] },
  { key: 'stepGhostTwist', goal: turnedRight, moves: TURNS, phases: [turnCorners] },
  { key: 'stepFlipEdges', goal: isSolved, moves: TURNS, phases: [flipEdges] },
]
