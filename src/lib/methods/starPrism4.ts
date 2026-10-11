import { isSolved } from '../cube'
import type { MoveSet } from '../moveSet'
import type { MethodPlan } from '../solverKit'
import { applyStarMove } from '../star'
import type { Cube, RingMove, StarMove, Turn } from '../types'
import { ringTurns, STAR_PLAN, starSet } from './starPrism'

/**
 * 4-Star Prism, "two stars", as taught on fan2cube.fr (4-star1): the puzzle is
 * two 2-stars sharing a screw (see star.ts), the inner one (h, b) and the
 * outer one (H, B). Each is solved with the 2-star method, inner first:
 *
 *   1. The inner star   the 2-star plan on the inner layers alone, read as a
 *                       2-star (its points one layer out), its turns played
 *                       on u and d. It also puts the screw back.
 *   2. The outer star   the same plan on the outer layers. It starts and ends
 *                       with the screw in place, so it slashes an even number
 *                       of times, and between its slashes it turns only the
 *                       outer layers: the inner star sees nothing.
 *   3. Align            each star ends solved but possibly turned as a whole:
 *                       turn both inner layers together to match.
 *
 * No step duplicates the 2-star machinery: both stars are projections.
 */

type Star = 'inner' | 'outer'

/** The 2-star a layer pair forms with the screw, inner points moved out. */
function starOf(cube: Cube, star: Star): Cube {
  if (star === 'outer') return cube.filter((c) => Math.abs(c.position[1]) !== 1)
  return cube
    .filter((c) => Math.abs(c.position[1]) <= 1)
    .map((c) => ({ ...c, position: [c.position[0], 2 * c.position[1], c.position[2]] }))
}

const INNER_RING: Record<RingMove['ring'], RingMove['ring']> = { U: 'u', D: 'd', u: 'u', d: 'd' }

/** A turn of the projected 2-star, played on the 4-star. */
function lift(turn: Turn, star: Star): Turn {
  const move = turn as StarMove
  return star === 'outer' || 'slash' in move ? move : { ...move, ring: INNER_RING[move.ring] }
}

function liftSet(set: MoveSet, star: Star): MoveSet {
  return {
    generators: set.generators.map((t) => lift(t, star)),
    turns: set.turns.map((t) => lift(t, star)),
    restricted: set.restricted,
  }
}

/** The 2-star plan on one star, its steps renamed. */
function onStar(star: Star, keys: readonly string[]): MethodPlan {
  return STAR_PLAN.map((spec, i) => ({
    key: keys[i]!,
    goal: (cube: Cube) => spec.goal(starOf(cube, star)),
    moves: liftSet(spec.moves, star),
    phases: spec.phases.map(
      (phase) => (cube: Cube) => phase(starOf(cube, star)).map((t) => lift(t, star)),
    ),
  }))
}

/** Turn both inner layers together until they line up with the outer ones. */
function align(cube: Cube): StarMove[] {
  for (let k = 1; k < 6; k++) {
    const moves: StarMove[] = [
      { ring: 'u', amount: k as RingMove['amount'] },
      { ring: 'd', amount: (6 - k) as RingMove['amount'] },
    ]
    if (isSolved(moves.reduce(applyStarMove, cube))) return moves
  }
  return []
}

export const STAR4_PLAN: MethodPlan = [
  ...onStar('inner', ['stepInnerIsolate', 'stepInnerBottom', 'stepInnerTop']),
  ...onStar('outer', ['stepOuterIsolate', 'stepOuterBottom', 'stepOuterTop']),
  {
    key: 'stepAlignStars',
    goal: isSolved,
    moves: starSet([...ringTurns('u'), ...ringTurns('d')]),
    phases: [align],
  },
]
