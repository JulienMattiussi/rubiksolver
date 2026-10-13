import { GHOST_TURNS } from './ghost'
import { GEAR_TURNS } from './gear'
import { RAINBOW_TURNS } from './rainbow'
import { movesFor, parseMoves, sameLayer } from './moves'
import { isGear } from './types'
import type { CubeShape, Move, Turn } from './types'

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
  readonly generators: readonly Turn[]
  /** Every concrete turn the set allows. */
  readonly turns: readonly Turn[]
}

/** Build a move set from notation (`'M U'`, `'U D L R F2 B2'`...). */
export function moveSet(notation: string): MoveSet {
  const generators = parseMoves(notation)
  const turns = generators.flatMap((g): Move[] =>
    g.amount === 2 ? [g] : ([1, 2, 3] as const).map((amount) => ({ ...g, amount })),
  )
  return { generators, turns }
}

/** Every plain face turn of a 2x2/3x3: the set of steps that use algorithms. */
export const OUTER_TURNS = moveSet('U D L R F B')

/** Every turn a shape has (inner slices and wide turns included on a 4x4;
 *  each side's half turn on the Floppy Ghost, each triangle's third on the
 *  Rainbow). */
export function allTurnsOf(shape: CubeShape): MoveSet {
  const turns =
    shape === 'ghost'
      ? GHOST_TURNS
      : shape === 'rainbow'
        ? RAINBOW_TURNS
        : isGear(shape)
          ? GEAR_TURNS
          : movesFor(shape)
  return { generators: turns, turns }
}

/** Whether `move` is one of the turns `set` allows. */
export function allows(set: MoveSet, move: Turn): boolean {
  return set.turns.some((t) => sameLayer(t, move) && amountOf(t) === amountOf(move))
}

const amountOf = (turn: Turn): number => ('amount' in turn ? turn.amount : 0)
