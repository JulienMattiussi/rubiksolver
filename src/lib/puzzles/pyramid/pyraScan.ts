import type { FlatFace, FlatScan } from '../../editor/scan/plan'
import type { Vec3 } from '../../core/types'
import { PYRA_CORNERS, PYRA_FACE_COLOR } from './pyraminx'

/**
 * How a camera scans a pyramid (the Pyraminx and its kin: lib/editor/scan/
 * plan.ts, `flat`), face by face as one holds it: the green face toward the
 * lens, the top point up; turned a third of a turn left twice, the top
 * point staying up (the face on the right comes in front each time); then
 * its top point tipped backward, the bottom face coming to the lens, the
 * side it turned on now on top, a point down. Shown to a camera facing the
 * user, left and right swap: the left face comes first, the bottom then
 * turned on the other side.
 */

type Corner = keyof typeof PYRA_CORNERS

/** The face opposite a corner: its outward normal, and its color. */
const opposite = (corner: Corner) => ({
  normal: PYRA_CORNERS[corner].map((x) => -x) as unknown as Vec3,
  frontColor: PYRA_FACE_COLOR[corner],
})

const sum = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

/** A third of a turn about the top point; the bottom shown, by the angle
 *  between two faces (180 - 70.5 degrees). */
const SPIN = 120
const TOPPLE = 109

function faces(behind: boolean): FlatFace[] {
  // The faces round the top point, in the order a turn left brings them.
  const round: Corner[] = behind ? ['B', 'R', 'L'] : ['B', 'L', 'R']
  // The bottom shows turned on the bottom side of the last face: the side
  // between the two corners other than the top and the one it faces.
  const last = round[2]!
  const hinge = (['L', 'R', 'B'] as Corner[]).filter((c) => c !== last)
  const top = PYRA_CORNERS.U
  // The top's color names no face on top (a point is): the bottom's, unused
  // (the faces are never told by their colors).
  const upColor = PYRA_FACE_COLOR.U
  return [
    ...round.map((corner, i): FlatFace => ({
      ...opposite(corner),
      up: top,
      upColor,
      ...(i ? { move: 'spin', angle: SPIN } : { move: 'first' }),
    })),
    {
      ...opposite('U'),
      up: sum(PYRA_CORNERS[hinge[0]!], PYRA_CORNERS[hinge[1]!]),
      pointDown: true,
      upColor,
      move: 'topple',
      angle: TOPPLE,
    },
  ]
}

export const PYRA_SCAN: FlatScan = { flat: faces }
