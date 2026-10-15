import { isSolved } from '../../core/cube'
import { centersOff, withoutMarks } from '../../puzzles/diagonal/fisher'
import { invertMoves } from '../../core/moves'
import { moveSet } from '../../core/moveSet'
import { projectPlan, relMoves, SIDES, type MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import type { Cube, Move } from '../../core/types'

/**
 * The Fisher Cube (fisher.ts) solved as fan2cube.fr teaches it (fishercube2):
 * "exactement comme un Rubik's Cube", a 3x3 method on its colors (the side
 * centers' marks set aside), then the side centers turned back.
 *
 * (H)+(G)- = Hd'h'd.H'd'hd turns the top center a quarter one way and the
 * left one the other, nothing else: the top center, a square, never shows
 * it, so this turns a side center alone. Held from each side (and played
 * backwards), it turns any of them either way. Notation (page -> app):
 * H G = U L, d the inner slice by D (2R), h the one by H (2U).
 */

/** (H)+(G)- */
export const CENTER_TURN = "U 2R' 2U' 2R U' 2R' 2U 2R"

/** The formula from each side, both ways. */
const TURNERS = SIDES.flatMap((front) => {
  const moves = relMoves(CENTER_TURN, front)
  return [moves, invertMoves(moves)]
})

/** Each side center turned back, by the fewest formulas. */
function turnCenters(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  for (let guard = 0; guard < 8 && centersOff(state).length; guard++) {
    const [off] = centersOff(state)
    const at = off!.position.join()
    // The formula that brings it nearest home: home in one, else in two.
    const home = (s: Cube) => !centersOff(s).some((c) => c.position.join() === at)
    const moves =
      TURNERS.find((m) => home(applyMoves(state, m))) ??
      TURNERS.find((m) => home(applyMoves(state, [...m, ...m])))!
    const played = home(applyMoves(state, moves)) ? moves : [...moves, ...moves]
    state = applyMoves(state, played)
    all.push(...played)
  }
  return all
}

/** A 3x3 plan, played on the Fisher Cube: on its colors, then its centers. */
export function fisherPlan(plan: MethodPlan): MethodPlan {
  return [
    ...projectPlan(plan, withoutMarks),
    {
      key: 'stepFisherCenters',
      goal: isSolved,
      moves: moveSet('U D L R F B 2U 2D 2L 2R 2F 2B'),
      phases: [turnCenters],
    },
  ]
}
