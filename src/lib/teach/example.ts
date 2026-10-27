import { invertMoves } from '../core/moves'
import { applyMoves } from '../core/turn'
import type { Cube, Turn } from '../core/types'
import type { RecapStage, Tutorial, TutorialStep } from './tutorial'

/** A formula of the reminder shown on the puzzle, held the usual way: the
 *  turns it makes (`moves`), on the solved puzzle with them undone, so that
 *  playing it solves it again, and a step reading it so, the pieces it puts
 *  back its subjects (an arrow each, their colors kept). */
export function formulaExample(
  tutorial: Tutorial,
  solved: Cube,
  stage: RecapStage,
  formula: readonly Turn[],
): { cube: Cube; moves: Turn[]; step: TutorialStep } {
  const hold = tutorial.frame.holds[0]!
  const moves = formula.map((turn) => tutorial.frame.played(hold, turn))
  const cube = applyMoves(solved, invertMoves(moves))
  const same = (a: readonly number[], b: readonly number[]) => a.join() === b.join()
  const subjects = cube.flatMap((c, i) => {
    const home = solved[i]!
    const back =
      same(c.position, home.position) &&
      c.stickers.every((s, k) => same(s.normal, home.stickers[k]!.normal))
    return back ? [] : [i]
  })
  const side = stage.side?.(cube)
  return {
    cube,
    moves,
    step: {
      kind: 'figure',
      key: stage.key,
      hold: () => hold,
      focus: [],
      subjects,
      ...(side && { side }),
      ...(stage.marker && { marker: stage.marker }),
      placed: [],
      suggestion: null,
      pickable: [],
      slots: () => [],
      formula: () => [...moves],
    },
  }
}
