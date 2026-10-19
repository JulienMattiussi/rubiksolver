import { stateKey } from '../core/cube'
import { applyMoves } from '../core/turn'
import type { Cube, Dims, Turn } from '../core/types'

/**
 * The one breadth-first search over whole formulas (a method's macros, or
 * single turns as one-turn formulas): the fewest of them, played one after
 * the other, bringing a state to a goal. What makes each use its own is
 * declared: what the goal reads of a state (`key`: states alike are one,
 * so a search on a few pieces stays small), how many formulas at most, the
 * mechanism a state of some pieces only turns on, and which formulas a
 * state lets through (a bandaged puzzle's blocks).
 */

export interface FormulaSearch<T extends Turn> {
  /** What tells two states apart (by default, everything). */
  readonly key?: (cube: Cube) => string
  /** The most formulas in a row (by default, until every state is seen). */
  readonly depth?: number
  /** The mechanism the state turns on, when it holds some pieces only. */
  readonly mechanism?: Dims
  /** Whether a formula goes through on a state (by default, all do). */
  readonly allowed?: (cube: Cube, formula: readonly T[]) => boolean
}

/** A search's formulas, or why there are none (a puzzle that cannot be
 *  solved so: the validation relies on the throw). */
export function found<T>(moves: T[] | null, why: string): T[] {
  if (!moves) throw new Error(why)
  return moves
}

/** The fewest `formulas` reaching `goal`, their turns one after the other;
 *  null if none does within the depth. */
export function searchFormulas<T extends Turn>(
  cube: Cube,
  formulas: readonly (readonly T[])[],
  goal: (cube: Cube) => boolean,
  options: FormulaSearch<T> = {},
): T[] | null {
  return searchChain(cube, formulas, goal, options)?.flatMap((i) => formulas[i]!) ?? null
}

/** The same search, as the formulas played (their indices, in order): what
 *  a tutorial shows one at a time, each held its own way. */
export function searchChain<T extends Turn>(
  cube: Cube,
  formulas: readonly (readonly T[])[],
  goal: (cube: Cube) => boolean,
  { key = stateKey, depth = Infinity, mechanism, allowed }: FormulaSearch<T> = {},
): number[] | null {
  if (goal(cube)) return []
  const seen = new Set([key(cube)])
  let frontier: { state: Cube; chain: number[] }[] = [{ state: cube, chain: [] }]
  for (let level = 1; level <= depth && frontier.length; level++) {
    const next: typeof frontier = []
    for (const { state, chain } of frontier) {
      for (const [i, formula] of formulas.entries()) {
        if (allowed && !allowed(state, formula)) continue
        const after = applyMoves(state, formula, mechanism)
        const k = key(after)
        if (seen.has(k)) continue
        seen.add(k)
        const path = [...chain, i]
        if (goal(after)) return path
        next.push({ state: after, chain: path })
      }
    }
    frontier = next
  }
  return null
}
