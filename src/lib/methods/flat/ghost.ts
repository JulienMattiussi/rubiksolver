import { GHOST_SIDES, parseGhostMoves } from '../../puzzles/flat/ghost'
import { invertMoves } from '../../core/moves'
import type { GhostMove } from '../../core/types'

/**
 * Floppy Ghost, "corners then edges", as fan2cube.fr teaches it
 * (floppyghost1): the corners (its "sommets") first, then the edges. The
 * method is its tutorial's (lib/tutorials/flat/ghost.ts):
 *
 *   1. Corners placed   3-cycles of corners, (H2 D2)2, and single turns
 *   2. Corners turned   D2 B2 P2 G2 P2 B2 D2 H2 turns over the two top
 *                       corners (and flips the top and left edges, which
 *                       the last step sees to)
 *   3. Edges flipped    two at a time, (H2 D2)3, which flips the top and
 *                       right edges and touches nothing else
 *
 * Each formula serves from each of the five sides (the mechanism looks the
 * same from each).
 */

/** The formulas, as the page writes them; their effects are asserted in
 *  tests/unit/puzzles/flat/ghost.test.ts. */
export const CYCLE_CORNERS = parseGhostMoves('(H²D²)²')
export const TURN_CORNERS = parseGhostMoves('D²B²P²G² .P² B²D²H²')
export const FLIP_EDGES = parseGhostMoves('(H²D²)^3')

/** A formula played from each side (each side's letter moved on by one,
 *  two... sides clockwise), and each undone. */
export const aroundGhost = (moves: readonly GhostMove[]): GhostMove[][] =>
  GHOST_SIDES.flatMap((_, r) => {
    const turned = moves.map((m) => ({
      side: GHOST_SIDES[(GHOST_SIDES.indexOf(m.side) + r) % GHOST_SIDES.length]!,
    }))
    return [turned, invertMoves(turned)]
  })
