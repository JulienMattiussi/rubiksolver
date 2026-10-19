import { cubeShape, turnDims } from './cube'
import { MODELS } from '../puzzles/models'
import { FACE_SPEC, layerCoords, rotateN } from './geometry'
import { isFaceTurn, kindOf, type TurnRotation } from './moveKind'
import { SHAPE_DIMS, SHAPE_SHIFTS } from './types'
import type { Cube, Dims, Move, Turn } from './types'

/**
 * What a move turns, whether it can, and the turn itself. A move rotates a
 * slab of cubies by an exact 90 or 180 degree integer rotation, so positions
 * and normals never drift.
 *
 * Turns act on the puzzle's mechanism (`turnDims`): its own layers, except on
 * a shape-shifting puzzle, which turns like the bigger cube it is cut from.
 * Functions taking a `mechanism` expect those dimensions.
 */

/** A slab: the open interval between two cut planes along a move's axis. */
interface Slab {
  readonly lo: number
  readonly hi: number
}

/**
 * The slab `move` turns. A cut sits halfway between two layers, so a piece is
 * inside when `lo < coord < hi`, and no piece ever sits on a cut.
 *
 * Naming a slab by its cuts rather than by layer coordinates is what keeps
 * this right on a shape that shifts: a piece pushed out of the box stays on
 * the same side of the same cut, so its face still carries it along.
 */
export function moveSlab(move: Move, mechanism: Dims): Slab {
  if (move.whole) return { lo: -Infinity, hi: Infinity }
  const spec = FACE_SPEC[move.face]
  const coords = layerCoords(mechanism[spec.coordIndex])
  const outermost = spec.dir > 0 ? coords.length - 1 : 0
  /** Cut between layer `i` and layer `i + 1`, counted from the face inwards. */
  const cut = (i: number): number => {
    const a = coords[outermost - spec.dir * i]
    const b = coords[outermost - spec.dir * (i + 1)]
    if (a === undefined || b === undefined) {
      throw new Error(`moveSlab: no layer ${i + 2} in from face ${move.face}`)
    }
    return (a + b) / 2
  }
  const deep = move.depth ?? 1
  const inward = cut(deep - 1)
  const outward = spec.dir > 0 ? { lo: inward, hi: Infinity } : { lo: -Infinity, hi: inward }
  if (deep === 1 || move.wide) return outward
  // A lone inner slice is bounded on its outer side too.
  return spec.dir > 0 ? { lo: inward, hi: cut(deep - 2) } : { lo: cut(deep - 2), hi: inward }
}

/** Whether a coordinate falls inside a slab. */
export function inSlab(coord: number, slab: Slab): boolean {
  return coord > slab.lo && coord < slab.hi
}

/** Whether a cubie position is in the slab `move` turns. */
function turnsPosition(move: Move, mechanism: Dims): (position: readonly number[]) => boolean {
  const a = FACE_SPEC[move.face].coordIndex
  const slab = moveSlab(move, mechanism)
  return (position) => inSlab(position[a]!, slab)
}

/** Which cubies `move` turns, by index: the animation turns them, the move
 *  preview highlights them. */
export function turnedBy(cube: Cube, move: Turn): (index: number) => boolean {
  if (!isFaceTurn(move)) return kindOf(move)!.turned(cube, move)
  const turns = turnsPosition(move, turnDims(cubeShape(cube)))
  return (index) => turns(cube[index]!.position)
}

/** Which cubies `move` turns half as far as the others (a Gear Cube's
 *  slice, beside the face it turns), by index; none on other puzzles. */
export function halfTurnedBy(cube: Cube, move: Turn): (index: number) => boolean {
  return kindOf(move)?.halfTurned?.(cube, move) ?? (() => false)
}

/**
 * Whether the mechanism lets `move` turn in this state. Always, on a puzzle
 * that keeps its box. On one that shifts (the tower, turning like a 4x4x4):
 * - a wide turn (Rw) turns half the mechanism, which always goes;
 * - an outer turn (R) turns the end layer of the mechanism, which only goes
 *   when that layer is complete: a 2x2 on the tower, whatever stands behind
 *   it. In its box the tower has U and D only; after Rw, its top holds two
 *   cubes and U jams;
 * - inner slices are not part of it (a wide then an outer turn makes one).
 */
export function turnAllowed(cube: Cube, move: Turn): boolean {
  // Another kind's: its pieces are whole (a star's sectors, a Pyraminx's...).
  if (!isFaceTurn(move)) return true
  if (move.whole) return true
  const shape = cubeShape(cube)
  const own = MODELS[shape]?.turnAllowed
  if (own) return own(cube, move)
  if (!SHAPE_SHIFTS[shape]) return true
  if (move.wide) return true
  if (move.depth) return false
  const turned = turnedBy(cube, move)
  const inEnd = cube.filter((_, i) => turned(i)).length
  // Complete: as many cubes as the boxed puzzle's end layer (its two shortest
  // sides), 4 on the tower. Only corners reach an end layer, at +-1 on the
  // other axes, so four of them always form the full square.
  const [s1, s2] = [...SHAPE_DIMS[shape]].sort((p, q) => p - q)
  return inEnd === s1! * s2!
}

const AXIS_VECTOR = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] } as const

export function turnRotation(move: Turn): TurnRotation {
  if (!isFaceTurn(move)) return kindOf(move)!.rotation(move)
  const spec = FACE_SPEC[move.face]
  const t = (((spec.sign * move.amount) % 4) + 4) % 4 // 1, 2 or 3 quarter turns
  return { axis: AXIS_VECTOR[spec.axis], angle: (t === 3 ? -1 : t) * (Math.PI / 2) }
}

/**
 * Apply one move, returning a new cube (the input is left untouched). The
 * `mechanism` defaults to the puzzle's own; passing it lets a search turn a
 * handful of tracked pieces without the rest of the puzzle (pieceSearch.ts).
 */
export function applyMove(
  cube: Cube,
  move: Turn,
  mechanism: Dims = turnDims(cubeShape(cube)),
): Cube {
  if (!isFaceTurn(move)) return kindOf(move)!.apply(cube, move, mechanism)
  return applyFaceTurn(cube, move, mechanism)
}

/** A cube's face turn played (the core's own kind of move). */
function applyFaceTurn(cube: Cube, move: Move, mechanism: Dims): Cube {
  const spec = FACE_SPEC[move.face]
  const turns = turnsPosition(move, mechanism)
  const times = spec.sign * move.amount
  return cube.map((cubie) => {
    if (!turns(cubie.position)) return cubie
    // A Z-Twist side center a quarter turn further (twist.ts); a gear keeps
    // its spin (a top or bottom turn of the Gear Cube Extreme).
    const twisted = cubie.spin !== undefined && cubie.stickers.length === 1 && times % 2 !== 0
    return {
      ...cubie,
      ...(twisted && { spin: 1 - cubie.spin! }),
      position: rotateN(cubie.position, spec.axis, times),
      stickers: cubie.stickers.map((s) => ({
        normal: rotateN(s.normal, spec.axis, times),
        color: s.color,
      })),
    }
  })
}

/** Apply a sequence of moves left to right. */
export function applyMoves(
  cube: Cube,
  moves: readonly Turn[],
  mechanism: Dims = turnDims(cubeShape(cube)),
): Cube {
  return moves.reduce((state, move) => applyMove(state, move, mechanism), cube)
}
