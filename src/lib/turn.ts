import { cubeShape, turnDims } from './cube'
import { FACE_SPEC, layerCoords, rotateN } from './geometry'
import { SHAPE_DIMS, SHAPE_SHIFTS } from './types'
import type { Axis, Cube, Dims, Move } from './types'

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
export function turnedBy(cube: Cube, move: Move): (index: number) => boolean {
  const turns = turnsPosition(move, turnDims(cubeShape(cube)))
  return (index) => turns(cube[index]!.position)
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
export function turnAllowed(cube: Cube, move: Move): boolean {
  const shape = cubeShape(cube)
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

/** How a renderer animates a move: about which axis, by which angle. */
export interface TurnRotation {
  readonly axis: Axis
  /** Radians (right-hand rule), taking the shortest path. */
  readonly angle: number
}

export function turnRotation(move: Move): TurnRotation {
  const spec = FACE_SPEC[move.face]
  const t = (((spec.sign * move.amount) % 4) + 4) % 4 // 1, 2 or 3 quarter turns
  return { axis: spec.axis, angle: (t === 3 ? -1 : t) * (Math.PI / 2) }
}

/**
 * Apply one move, returning a new cube (the input is left untouched). The
 * `mechanism` defaults to the puzzle's own; passing it lets a search turn a
 * handful of tracked pieces without the rest of the puzzle (pieceSearch.ts).
 */
export function applyMove(
  cube: Cube,
  move: Move,
  mechanism: Dims = turnDims(cubeShape(cube)),
): Cube {
  const spec = FACE_SPEC[move.face]
  const turns = turnsPosition(move, mechanism)
  const times = spec.sign * move.amount
  return cube.map((cubie) => {
    if (!turns(cubie.position)) return cubie
    return {
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
  moves: readonly Move[],
  mechanism: Dims = turnDims(cubeShape(cube)),
): Cube {
  return moves.reduce((state, move) => applyMove(state, move, mechanism), cube)
}
