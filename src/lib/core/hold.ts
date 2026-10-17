import { FACE_NORMAL } from './geometry'
import type { Face, Turn, Vec3 } from './types'
import { isFaceMove } from './types'

/**
 * The ways a puzzle may be held (a tutorial's: the formula's letters read
 * from where you hold it), as a frame of holds. Turns stay written in the
 * puzzle's own frame; read in a hold, each takes the name of where it now
 * stands, so a formula written once (`R U R' U'`) serves every side. A
 * model whose turns are not a cube's gives its own frame.
 */

/** A way to hold the puzzle: the name of the side held in front. */
export type Hold = string

export interface HoldFrame {
  /** Its holds, the usual one first, each the next round the top. */
  readonly holds: readonly Hold[]
  /** The outward normal of the side a hold has in front (the view turns
   *  toward it). */
  readonly front: (hold: Hold) => Vec3
  /** A turn as read in a hold (named where its side now stands). */
  readonly inHold: (hold: Hold, turn: Turn) => Turn
  /** The turn of the puzzle a turn read in a hold makes. */
  readonly played: (hold: Hold, turn: Turn) => Turn
}

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

/**
 * The holds of a puzzle turned by its faces (a cube's turns), from its
 * faces' outward normals: the sides round its top (`up`), from `front`,
 * each the right of the one before (seen with it in front), found without
 * any angle, so it has as many holds as sides round its top. The top and
 * bottom keep their names; a turn of another kind is read as it is.
 */
export function ringHolds(
  normals: Readonly<Record<Face, Vec3>>,
  up: Face,
  front: Face,
): HoldFrame & { readonly faceAt: (hold: Hold, face: Face) => Face } {
  const faces = Object.keys(normals) as Face[]
  const faceOf = (n: Vec3) => faces.find((f) => normals[f].join() === n.join())
  const ring: Face[] = [front]
  for (
    let f = faceOf(cross(normals[up], normals[front]));
    f && f !== front;
    f = faceOf(cross(normals[up], normals[f]))
  ) {
    ring.push(f)
  }
  const step = (hold: Hold, face: Face, sign: 1 | -1): Face => {
    const at = ring.indexOf(face)
    const by = ring.indexOf(hold as Face)
    return at < 0 ? face : ring[(at + sign * by + ring.length) % ring.length]!
  }
  const relabel = (sign: 1 | -1) => (hold: Hold, turn: Turn) =>
    isFaceMove(turn) ? { ...turn, face: step(hold, turn.face, sign) } : turn
  return {
    holds: ring,
    front: (hold) => normals[hold as Face],
    /** The side of the puzzle seen as `face` in a hold. */
    faceAt: (hold, face) => step(hold, face, 1),
    inHold: relabel(-1),
    played: relabel(1),
  }
}

/** A cube's (and any cuboid's): its four sides round the top, the front
 *  first. */
export const CUBE_HOLDS = ringHolds(FACE_NORMAL, 'U', 'F')
