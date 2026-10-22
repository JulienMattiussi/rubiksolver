import type { MegaFace } from '../../core/types'
import type { RingFace, ScanMove } from '../../editor/scan/plan'
import { megaRing } from '../polyhedron/megaminxScan'

/**
 * How a camera scans a Holey Megaminx (lib/editor/scan/plan.ts): no center
 * tells its faces, so it is shown face by face by gestures alone, from any
 * face (worked out on a dodecahedron, then named here as the Megaminx's
 * faces, any face being F):
 *
 *   1      any face, a side flat on top: F, U on top
 *   2-5    turned left to the next face, the top staying on top: R, BR,
 *          BL, L (the five round U)
 *   6      tilted toward the lens, the face on top coming in front: U,
 *          L now at the bottom (a point on top)
 *   7      turned half round, the face at the back coming in front: D,
 *          DBR on top (opposite faces are a fifth of a turn apart)
 *   8      tilted toward the lens again: DBR, D at the bottom
 *   9-12   turned left to the next face, the bottom staying at the
 *          bottom: DR, DL, DBL, B (the five round D)
 *
 * Its pieces are sorted into its twelve colors, ten stickers each.
 */

/** A face's gesture: its front, the side flat on top or at the bottom. */
type Shown = readonly [MegaFace, MegaFace, ScanMove, 'top' | 'bottom', number?]

/** A turn to the next face round a face: a fifth; a tilt to the next face:
 *  the angle between two faces' normals (180 less the dihedral angle). */
const FIFTH = 72
const TILT = 63

const ORDER: readonly Shown[] = [
  ['F', 'U', 'first', 'top'],
  ...(['R', 'BR', 'BL', 'L'] as const).map((f): Shown => [f, 'U', 'turn', 'top', FIFTH]),
  ['U', 'L', 'tilt', 'bottom', TILT],
  ['D', 'DBR', 'flip', 'top', 180],
  ['DBR', 'D', 'tilt', 'bottom', TILT],
  ...(['DR', 'DL', 'DBL', 'B'] as const).map((f): Shown => [f, 'D', 'below', 'bottom', FIFTH]),
]

export const holeyScan = (): RingFace[] =>
  ORDER.map(([front, side, move, flat, angle]) =>
    megaRing(front, side, {
      move,
      ...(flat === 'bottom' && { bottom: true as const }),
      ...(angle !== undefined && { angle }),
    }),
  )
