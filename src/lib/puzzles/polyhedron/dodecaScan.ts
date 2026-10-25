import { cross, dot } from '../../core/geometry'
import type { Color, Cube, Vec3 } from '../../core/types'
import type { FlatFace, FlatScan, ScanMove } from '../../editor/scan/plan'

/**
 * How a camera scans a dodecahedron by its flat faces (the Skewb Ultimate:
 * lib/editor/scan/plan.ts, `flat`), with the Holey Megaminx's gestures
 * (holey/holeyScan.ts), worked out on its faces' normals: a face, a side
 * flat on top; turned left four times, the top staying on top; tilted
 * toward the lens (the top in front, a point on top); turned half round;
 * tilted again; turned left four times, the bottom staying at the bottom.
 * Shown to a camera facing the user, left and right swap.
 */

/** A turn to the next face round a face: a fifth; a tilt to the next face:
 *  the angle between two faces' normals. */
const FIFTH = 72
const TILT = 63
const HALF = 180

const negate = (v: Vec3): Vec3 => [-v[0] + 0, -v[1] + 0, -v[2] + 0]

/** The faces of a dodecahedron `solved` shows, from `first`, `top` the
 *  face beside it on top. */
export function dodecaScan(solved: Cube, first: Vec3, top: Vec3): FlatScan {
  const colorOf = new Map<string, Color>()
  for (const cubie of solved) {
    for (const s of cubie.stickers) colorOf.set(s.normal.join(), s.color)
  }
  const normals = [...colorOf.keys()].map((k) => k.split(',').map(Number) as unknown as Vec3)
  const color = (n: Vec3) => colorOf.get(n.join())!
  // Two faces are beside each other when their normals lean the same way
  // (the opposite ones and the others lean apart).
  const beside = (a: Vec3, b: Vec3) => a.join() !== b.join() && dot(a, b) > 0
  const flat = (behind: boolean): FlatFace[] => {
    let front = first
    // The face whose side is on top, or at the bottom.
    let side = top
    let onTop = true
    const out: FlatFace[] = []
    const show = (move: ScanMove, angle?: number) =>
      out.push({
        normal: front,
        up: onTop ? side : negate(side),
        ...(onTop && { pointDown: true as const }),
        sides: 5,
        frontColor: color(front),
        upColor: color(side),
        move,
        ...(angle !== undefined && { angle }),
      })
    // Turned left about the face on top (or at the bottom): the face beside
    // both, on the right (the left behind a mirrored camera), comes.
    const turn = () => {
      const up = onTop ? side : negate(side)
      const right = cross(up, front).map((x) => (behind ? -x : x))
      front = normals.find((n) => beside(n, side) && beside(n, front) && dot(n, right) > 0)!
    }
    // Tilted toward the lens: the face on top comes in front, the one that
    // was there at the bottom.
    const tilt = () => {
      ;[front, side, onTop] = [side, front, false]
    }
    show('first')
    for (let k = 0; k < 4; k++) {
      turn()
      show('turn', FIFTH)
    }
    tilt()
    show('tilt', TILT)
    // Turned half round about the vertical: the face behind comes, the
    // way up kept; the side of it nearest up is now flat on top.
    const up = negate(side)
    front = negate(front)
    side = normals.filter((n) => beside(n, front)).sort((a, b) => dot(b, up) - dot(a, up))[0]!
    onTop = true
    show('flip', HALF)
    tilt()
    show('tilt', TILT)
    for (let k = 0; k < 4; k++) {
      turn()
      show('below', FIFTH)
    }
    return out
  }
  return { flat, solid: 'dodecahedron' }
}
