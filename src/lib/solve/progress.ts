/** Progress of a step-based solution as it animates, for the steps UI. */

/**
 * Where a solution being walked stands, for its moves list: `played`, the
 * moves visibly done (the queue still plays toward `dispatched`, from below,
 * or from above when going back), and `focus`, the move to show: the one
 * under way (queued or animating, played or undone), or idle the next to
 * play: the very first one before anything is played. Read off the queue,
 * not the animation alone: between a click and its animation's start, the
 * focus stays put.
 */
export function walkFocus(
  dispatched: number,
  pending: number,
  rewinding: boolean,
): { played: number; focus: number } {
  const played = rewinding ? dispatched + pending : dispatched - pending
  return { played, focus: pending === 0 ? dispatched : rewinding ? played - 1 : played }
}

/** Where the step under way starts, in moves from the solution's start:
 *  the last step boundary before `dispatched` (mid-step, the step under way;
 *  right at a boundary, the step before it). */
export function stepStart(stepLengths: readonly number[], dispatched: number): number {
  let start = 0
  for (const len of stepLengths) {
    if (start + len >= dispatched) return start
    start += len
  }
  return start
}

/** Where the step under way ends, in moves from the solution's start: the
 *  first step not wholly sent yet (`dispatched` moves sent so far). */
export function stepEnd(stepLengths: readonly number[], dispatched: number): number {
  let end = 0
  for (const len of stepLengths) {
    end += len
    if (end > dispatched) return end
  }
  return end
}

interface StepProgress {
  /** Every move of this step has already animated. */
  readonly done: boolean
  /** This step is the one currently animating (or next to play). */
  readonly current: boolean
}

export interface SolveProgress {
  /** Total moves across all steps. */
  readonly total: number
  readonly steps: readonly StepProgress[]
}

/**
 * Compute per-step progress. `dispatched` is the number of moves already sent
 * to the animation queue (the started steps); `remaining` is how many of those
 * are still waiting (queue length plus the one animating). Their difference is
 * how many moves have visibly completed.
 */
export function solveProgress(
  stepLengths: readonly number[],
  dispatched: number,
  remaining: number,
): SolveProgress {
  const total = stepLengths.reduce((n, len) => n + len, 0)
  const played = dispatched - remaining
  let start = 0
  const steps = stepLengths.map((len) => {
    const end = start + len
    const step = { done: played >= end, current: played >= start && played < end }
    start = end
    return step
  })
  return { total, steps }
}
