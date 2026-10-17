import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { formatMoves, parseMoves, scramble } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Move } from '@/lib/core/types'
import { formulaUnderWay } from '@/lib/tutorial/keep'
import { markerPath, tonesOf, tutorialFor, type TutorialPick } from '@/lib/tutorial/tutorial'
import { seededRng } from '../../helpers'

/**
 * The 3x3 tutorial as it behaves, step after step, written down once
 * (`golden/cube3.json`): any rework of the tutorial's code must give it
 * back move for move. On a few fixed scrambles, the walk takes each step's
 * suggestion; at every step it notes what the step offers and, for every
 * piece and place one may pick, the formula and the way to hold the
 * puzzle (or, for the last layer, the figure read and its pieces); for the
 * suggestion, the pieces' tones, the arrow's path, and the
 * formula under way when turns by hand follow it or stray from it.
 */

const SEEDS = [3, 11, 27, 42]
const tutorial = tutorialFor('3')!

const notation = (moves: readonly Move[] | null) => (moves ? formatMoves(moves) : null)
const at = (pick: TutorialPick) => `${pick.piece}>${pick.slot.join()}`

function record(cube: Cube) {
  const step = tutorial.stepOf(cube)!
  const pick = step.suggestion
  const formulas: Record<string, { moves: string | null; hold: string }> = {}
  for (const piece of step.pickable) {
    for (const slot of step.slots(piece)) {
      const p = { piece, slot }
      formulas[at(p)] = { moves: notation(step.formula(p)), hold: step.hold(p) }
    }
  }
  const moves = step.formula(pick)
  const underWay = (manual: Move[]) => {
    const now = applyMoves(cube, manual)
    const u = formulaUnderWay(tutorial, tutorial.stepOf(now, cube)!, pick, now, cube, manual)
    return { rest: notation(u.rest), shown: notation(u.shown), done: u.done }
  }
  return {
    key: step.key,
    stage: step.stage ?? null,
    progress: step.progress ?? null,
    comingSoon: step.comingSoon ?? false,
    hold: step.hold(pick),
    figure: step.figure ?? null,
    focus: step.focus ?? null,
    placed: step.placed,
    pickable: step.pickable,
    suggestion: pick && at(pick),
    moves: notation(moves),
    formulas,
    tones: moves
      ? tonesOf(cube, moves, pick, step.placed)
          .map((t) => t[0])
          .join('')
      : null,
    arrow: pick && moves ? markerPath(cube, moves, pick, step.marker) : null,
    followed: moves && moves.length > 1 ? underWay(moves.slice(0, 1)) : null,
    strayed: moves ? underWay(parseMoves('D')) : null,
  }
}

describe('3x3 tutorial, as it behaves', () => {
  it('gives back, step after step, what it was written down giving', async () => {
    const walks = SEEDS.map((seed) => {
      let cube = applyMoves(solvedCube('3'), scramble('3', 25, seededRng(seed)))
      const steps = []
      for (let guard = 0; guard < 20; guard++) {
        const step = tutorial.stepOf(cube)!
        steps.push(record(cube))
        if (step.comingSoon) break
        cube = applyMoves(cube, step.formula(step.suggestion)!)
      }
      return { seed, steps }
    })
    await expect(JSON.stringify(walks, null, 1)).toMatchFileSnapshot('golden/cube3.json')
  }, 120000)
})
