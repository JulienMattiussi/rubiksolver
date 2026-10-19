import { stateKey } from '../core/cube'
import { advancedMovesFor } from '../core/moves'
import { allTurnsOf, type MoveSet } from '../core/moveSet'
import type { CubeShape } from '../core/shapes'
import { applyMoves } from '../core/turn'
import type { Cube, Turn } from '../core/types'
import type { MethodPlan } from '../solve/solverKit'
import type { Tutorial } from './tutorial'

/**
 * A method taught by a tutorial, declared once: its solving plan is the
 * tutorial played to the end, each stage a step of the solution, solved by
 * the formulas the tutorial suggests one after another (its piece
 * suggested, its figure recognized) until it moves on. The solution shown
 * is then what the tutorial teaches, step for step.
 */

/** Formulas a stage may play before it is given up. */
const MAX_FORMULAS = 200

/** Every turn a tutorial may play on a puzzle: its own, those kept apart
 *  (a 3x3's middle slices, its centers put back) and the whole puzzle
 *  turned (the 2x2 turned over: x). */
function teachableTurns(shape: CubeShape): MoveSet {
  const own = allTurnsOf(shape)
  const whole = (['R', 'U', 'F'] as const).flatMap((face) =>
    ([1, 2, 3] as const).map((amount): Turn => ({ face, amount, whole: true })),
  )
  // Its own turns name it (the guide shows them); the others are let
  // through only.
  return { generators: own.generators, turns: [...own.turns, ...advancedMovesFor(shape), ...whole] }
}

/** A tutorial's method on a puzzle: a step a stage, after its opening, if
 *  it has one (the 3x3's centers put back, optional). */
export function methodOf(tutorial: Tutorial, shape: CubeShape): MethodPlan {
  const moves = teachableTurns(shape)
  const stageAt = (cube: Cube) => {
    const step = tutorial.stepOf(cube)
    return !step || step.kind === 'toCome' ? Infinity : (step.stage ?? 0)
  }
  const past = (stage: number) => (cube: Cube) => stageAt(cube) > stage
  const play = (stage: number) => (cube: Cube) => {
    let state = cube
    const out: Turn[] = []
    // A state met again: the stage goes round in circles, as on a puzzle it
    // cannot solve (validation's impossible one): given up.
    const seen = new Set<string>()
    for (let n = 0; !past(stage)(state); n++) {
      const step = tutorial.stepOf(state)!
      const key = stateKey(state)
      const formula = n < MAX_FORMULAS && !seen.has(key) ? step.formula(step.suggestion) : null
      if (!formula) throw new Error(`${step.key}: no formula goes on`)
      seen.add(key)
      state = applyMoves(state, formula)
      out.push(...formula)
    }
    return out
  }
  const stages = tutorial.stageKeys.map((key, i) => ({
    key,
    goal: past(i + 1),
    moves,
    phases: [play(i + 1)],
  }))
  const { opening } = tutorial
  return opening
    ? [{ key: opening, goal: past(0), moves, phases: [play(0)], optional: true }, ...stages]
    : stages
}
