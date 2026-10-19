import { invertMoves, simplifyMoves } from '../core/moves'
import { applyMoves } from '../core/turn'
import { isFaceMove, type Cube, type Turn } from '../core/types'
import { sameTurn } from './segments'
import type { Tutorial, TutorialPick, TutorialStep } from './tutorial'

/** Whether a formula leaves the pieces a step keeps (`placed`) as they
 *  stood where it began (`begun`): seen as it leaves the puzzle, its turns
 *  of the whole puzzle (`x y z`) being a change of viewpoint, not a move. */
export function keepsPlaced(
  cube: Cube,
  moves: readonly Turn[],
  placed: readonly number[],
  begun: Cube,
): boolean {
  const after = applyMoves(cube, moves)
  const seen = applyMoves(
    begun,
    moves.filter((m) => isFaceMove(m) && m.whole),
  )
  return placed.every((p) => {
    const [a, b] = [after[p]!, seen[p]!]
    return (
      a.position.join() === b.position.join() &&
      a.stickers.every((s, k) => s.normal.join() === b.stickers[k]!.normal.join())
    )
  })
}

/** Whether turns are the start of a formula, turn for turn. */
const followed = (turns: readonly Turn[], formula: readonly Turn[]) =>
  turns.length <= formula.length && turns.every((t, i) => sameTurn(t, formula[i]!))

/** A step's formula as it stands: what is left to play (`rest`, null if
 *  none is found), and the formula to show (`shown`) with how many of its
 *  turns are played already (`done`). */
export interface FormulaUnderWay {
  readonly rest: Turn[] | null
  readonly shown: Turn[] | null
  readonly done: number
}

/**
 * The formula of a step under way, after turns by hand (`manual`, from
 * `begun` to `cube`): if they followed the formula shown when it began, it
 * stays shown, those turns played, the rest to play; else a formula from
 * here that keeps the pieces placed; else those turns undone, then the
 * formula from where it began.
 */
export function formulaUnderWay(
  tutorial: Tutorial,
  step: TutorialStep,
  pick: TutorialPick | null,
  cube: Cube,
  begun: Cube,
  manual: readonly Turn[],
): FormulaUnderWay {
  const fresh = (moves: Turn[] | null) => ({ rest: moves, shown: moves, done: 0 })
  if (manual.length === 0) return fresh(step.formula(pick))
  const fromStart = tutorial.stepOf(begun)?.formula(pick) ?? null
  if (fromStart && followed(manual, fromStart)) {
    return { rest: fromStart.slice(manual.length), shown: fromStart, done: manual.length }
  }
  const found = step.formula(pick)
  if (found && keepsPlaced(cube, found, step.placed, begun)) return fresh(found)
  return fresh(fromStart ? simplifyMoves([...invertMoves(manual), ...fromStart]) : null)
}
