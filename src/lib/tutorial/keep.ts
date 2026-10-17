import { invertMoves, simplifyMoves } from '../core/moves'
import { applyMoves } from '../core/turn'
import type { Cube, Move } from '../core/types'
import type { Tutorial, TutorialPick, TutorialStep } from './tutorial'

/** Whether a formula leaves the pieces a step keeps (`placed`) as they
 *  stood where it began (`begun`). */
export function keepsPlaced(
  cube: Cube,
  moves: readonly Move[],
  placed: readonly number[],
  begun: Cube,
): boolean {
  const after = applyMoves(cube, moves)
  return placed.every((p) => {
    const [a, b] = [after[p]!, begun[p]!]
    return (
      a.position.join() === b.position.join() &&
      a.stickers.every((s, k) => s.normal.join() === b.stickers[k]!.normal.join())
    )
  })
}

/** Whether turns are the start of a formula, move for move. */
const followed = (turns: readonly Move[], formula: readonly Move[]) =>
  turns.length <= formula.length &&
  turns.every(
    (t, i) =>
      t.face === formula[i]!.face &&
      t.amount === formula[i]!.amount &&
      t.depth === formula[i]!.depth &&
      t.wide === formula[i]!.wide,
  )

/**
 * The formula of a step under way, after turns by hand (`manual`, from
 * `begun` to `cube`): what is left of the formula shown when it began, if
 * they followed it; else a formula from here that keeps the pieces placed;
 * else those turns undone, then the formula from where it began.
 */
export function formulaUnderWay(
  tutorial: Tutorial,
  step: TutorialStep,
  pick: TutorialPick | null,
  cube: Cube,
  begun: Cube,
  manual: readonly Move[],
): Move[] | null {
  if (manual.length === 0) return step.formula(pick)
  const fromStart = tutorial.stepOf(begun)?.formula(pick) ?? null
  if (fromStart && followed(manual, fromStart)) return fromStart.slice(manual.length)
  const found = step.formula(pick)
  if (found && keepsPlaced(cube, found, step.placed, begun)) return found
  return fromStart ? simplifyMoves([...invertMoves(manual), ...fromStart]) : null
}
