import { movesFor, parseMoves } from './moves'
import type { CubeShape, Move } from './types'

/**
 * The turns a solving step is allowed to use, e.g. `<M, U>` for the end of
 * Roux or `<R, U>` for the Petrus F2L. A method is defined as much by these
 * restrictions as by its goals: they are what makes Roux be Roux and not
 * layers in disguise. `buildSteps` rejects any step that strays outside its
 * set, so the restriction is enforced, not just documented.
 *
 * A set is written as notation tokens: `R` allows every amount of that layer
 * (R, R2, R'), `R2` allows the half turn only.
 */
export interface MoveSet {
  /** One move per allowed layer, as written (amount 2 = half turns only). */
  readonly generators: readonly Move[]
  /** Every concrete turn the set allows. */
  readonly turns: readonly Move[]
  /** Whether the set is a real restriction worth showing to the learner. */
  readonly restricted: boolean
}

/** Build a move set from notation (`'M U'`, `'U D L R F2 B2'`...). */
export function moveSet(notation: string, restricted = true): MoveSet {
  const generators = parseMoves(notation)
  const turns = generators.flatMap((g): Move[] =>
    g.amount === 2 ? [g] : ([1, 2, 3] as const).map((amount) => ({ ...g, amount })),
  )
  return { generators, turns, restricted }
}

/** Every plain face turn of a 2x2/3x3: the set of steps that use algorithms. */
export const OUTER_TURNS = moveSet('U D L R F B', false)

/** Every turn a shape has (inner slices and wide turns included on a 4x4). */
export function allTurnsOf(shape: CubeShape): MoveSet {
  const turns = movesFor(shape)
  return { generators: turns, turns, restricted: false }
}

/** Whether `move` is one of the turns `set` allows. */
export function allows(set: MoveSet, move: Move): boolean {
  return set.turns.some(
    (t) =>
      t.face === move.face &&
      t.depth === move.depth &&
      t.wide === move.wide &&
      t.amount === move.amount,
  )
}
