import type { FlatFace, FlatScan } from '../../editor/scan/plan'
import type { Vec3 } from '../../core/types'
import { OCT_FACE_COLOR } from './oct4'

/**
 * How a camera scans an octahedron (the 4-Trajber's, the VTO, the GEM-0:
 * lib/editor/scan/plan.ts, `flat`), face by face as one holds it: its top
 * point up, the red face toward the lens; turned a quarter left three times
 * (the face on the right comes in front each time), the top point staying
 * up; then turned upside down, half round toward the lens (the face below
 * and behind comes in front, the bottom point up), and a quarter left three
 * times again. Shown to a camera facing the user, left and right swap.
 */

const cross = (a: readonly number[], b: readonly number[]): Vec3 => [
  a[1]! * b[2]! - a[2]! * b[1]!,
  a[2]! * b[0]! - a[0]! * b[2]!,
  a[0]! * b[1]! - a[1]! * b[0]!,
]
const sign = (v: readonly number[]): Vec3 => v.map((x) => Math.sign(x) + 0) as unknown as Vec3

const NORMALS: readonly Vec3[] = [...OCT_FACE_COLOR.keys()].map(
  (k) => k.split(',').map(Number) as unknown as Vec3,
)
const colorOf = (n: Vec3) => OCT_FACE_COLOR.get(n.join())!

/** A quarter turn, a half turn. */
const QUARTER = 90
const HALF = 180

function faces(behind: boolean): FlatFace[] {
  let up: Vec3 = [0, 1, 0]
  let front = NORMALS.find((n) => colorOf(n) === 'R')!
  // The face beside the one in front, the way a turn brings it (on the
  // right, or the left behind a mirrored camera): its normal across the
  // top's axis, then the top's side.
  const beside = (n: Vec3): Vec3 => {
    const across: Vec3 = [n[0] * (1 - Math.abs(up[0])), 0, n[2] * (1 - Math.abs(up[2]))]
    const side = cross(up, across).map((x) => (behind ? -x : x))
    return sign([side[0]! + up[0], side[1]! + up[1], side[2]! + up[2]])
  }
  const out: FlatFace[] = []
  for (let k = 0; k < 8; k++) {
    const move = k === 0 ? 'first' : k === 4 ? 'upend' : 'turn'
    out.push({
      normal: front,
      up,
      frontColor: colorOf(front),
      // The point on top names no face: the opposite face's (unused, the
      // faces are never told by their colors).
      upColor: colorOf(sign(front.map((x) => -x))),
      move,
      ...(k && { angle: k === 4 ? HALF : QUARTER }),
    })
    if (k === 3) {
      // Upside down: the face opposite the one in front comes in front, its
      // top the bottom point.
      front = sign(front.map((x) => -x))
      up = sign(up.map((x) => -x))
    } else {
      front = beside(front)
    }
  }
  return out
}

export const OCT_SCAN: FlatScan = { flat: faces, solid: 'octahedron' }
