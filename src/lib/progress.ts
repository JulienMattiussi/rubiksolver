/** Progress of a step-based solution as it animates, for the steps UI. */

interface StepProgress {
  /** Cumulative move index at which this step starts. */
  readonly start: number
  /** Cumulative move index at which this step ends. */
  readonly end: number
  /** Every move of this step has already animated. */
  readonly done: boolean
  /** This step is the one currently animating (or next to play). */
  readonly current: boolean
}

export interface SolveProgress {
  /** Total moves across all steps. */
  readonly total: number
  /** Moves that have actually animated so far. */
  readonly consumed: number
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
  const consumed = dispatched - remaining
  let start = 0
  const steps = stepLengths.map((len) => {
    const end = start + len
    const step: StepProgress = {
      start,
      end,
      done: consumed >= end,
      current: consumed >= start && consumed < end,
    }
    start = end
    return step
  })
  return { total, consumed, steps }
}
