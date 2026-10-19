import { MOVE_KINDS } from '../puzzles/moveKinds'
import type { FaceLabels } from './notation'
import type { Cube, Dims, Move, Turn } from './types'
import type { CubeShape } from './shapes'
import type { GuideSight, MoveDescription } from './guide'

/**
 * A kind of move: a puzzle family's own turns (a star prism's rings, the
 * Pyraminx's corners, the Megaminx's faces...), next to the cube's face
 * turns (`Move`), which the core turns itself. Each kind says how its moves
 * are written, undone, merged, played and animated; the core asks the
 * move's kind (`kindOf`) and, for none, does what a cube does. The kinds
 * are gathered by the puzzles (puzzles/moveKinds.ts), as their models are.
 */

/** How a renderer animates a turn: about which axis, by which angle. */
export interface TurnRotation {
  /** Unit vector of the axis, in the renderer's frame. */
  readonly axis: readonly [number, number, number]
  /** Radians (right-hand rule), taking the shortest path. */
  readonly angle: number
}

// Methods, not function properties: a kind of some moves is a kind of turns.
export interface MoveKind<T extends Turn> {
  /** Whether a turn is of this kind. */
  is(turn: Turn): boolean
  format(move: T, labels: FaceLabels): string
  /** The move undoing it. */
  invert(move: T): T
  /** Whether two moves of the kind turn the same layers. */
  sameLayer(a: T, b: T): boolean
  /** Consecutive moves of the same layers merged (a list holding some). */
  simplify(moves: readonly T[]): T[]
  /** Which pieces it turns, by index; and half as far (a Gear Cube's slice). */
  turned(cube: Cube, move: T): (index: number) => boolean
  halfTurned?(cube: Cube, move: T): (index: number) => boolean
  rotation(move: T): TurnRotation
  /** The move played on a state (on its `mechanism`'s layers). */
  apply(cube: Cube, move: T, mechanism: Dims): Cube
  /** What it does, for the move guide's sentence (core/guide.ts). */
  describe(move: T, shape: CubeShape): MoveDescription
  /** Where the move guide looks from to show it. */
  sight(move: T): GuideSight
  /** How far the pieces it half turns spin on themselves while it plays,
   *  in sixths (a Gear Cube's gears); none by default. */
  spin?(move: T): number
}

/** A turn's kind (none: a cube's face turn). */
export const kindOf = (turn: Turn): MoveKind<Turn> | undefined =>
  MOVE_KINDS.find((kind) => kind.is(turn))

/** How far a turn spins the pieces it half turns, in sixths (`spin`). */
export const turnSpinOf = (turn: Turn): number => kindOf(turn)?.spin?.(turn) ?? 0

/** Whether a turn is a cube's face turn, the core's own. */
export const isFaceTurn = (turn: Turn): turn is Move => !kindOf(turn)
