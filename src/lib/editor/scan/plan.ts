import { faceColorsOf } from '../../core/cube'
import { FACE_NORMAL, layerCoords, normalIndex, outerCoord } from '../../core/geometry'
import { isGridless, SHAPE_DIMS, SHAPE_SHIFTS, type CubeShape } from '../../core/shapes'
import { stickerId } from '../editorTables'
import { MODELS } from '../../puzzles/models'
import type { Color, Face, Vec3 } from '../../core/types'

/**
 * How a puzzle is scanned with a camera, face by face (pure, no React): the
 * face shown, the one on top, how to get there from the face before, and
 * which sticker each cell of the picture is. Everything derives from the
 * puzzle's dims and normals, so a cuboid's faces are just rectangles.
 */

/** How the puzzle is turned to show a face, from the one before. */
type ScanMove = 'first' | 'turn' | 'tilt' | 'flip'

export interface ScanFace {
  /** The face toward the camera, and the one on top of the picture. */
  readonly front: Face
  readonly up: Face
  readonly move: ScanMove
  /** Their solved colors, which the texts name when the face has a
   *  center telling it. */
  readonly frontColor: Color
  readonly upColor: Color
  readonly rows: number
  readonly cols: number
  /** The sticker id of each cell, row by row from the top left. */
  readonly cells: readonly string[]
  /** The cell that holds the face's center, which tells the face; none
   *  on an even face (the puzzle is then held any way, its colors told
   *  apart among themselves, anchors.ts). */
  readonly center: number | null
}

/** The faces in order: the four sides, the top up (white), turning the
 *  puzzle left each time; then tilted toward oneself (the top comes in
 *  front, the back on top), then turned half round (the bottom in front). */
const ORDER: readonly { front: Face; up: Face; move: ScanMove }[] = [
  { front: 'F', up: 'U', move: 'first' },
  { front: 'R', up: 'U', move: 'turn' },
  { front: 'B', up: 'U', move: 'turn' },
  { front: 'L', up: 'U', move: 'turn' },
  { front: 'U', up: 'R', move: 'tilt' },
  { front: 'D', up: 'R', move: 'flip' },
]

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

const axisOf = (v: Vec3): number => v.findIndex((x) => x !== 0)

/** The sticker ids of a face seen from outside, `up` on top: its right is
 *  up x front (right-handed), each axis' layers read along that side. */
function faceCells(shape: CubeShape, front: Face, up: Face) {
  const dims = SHAPE_DIMS[shape]
  const n = FACE_NORMAL[front]
  const u = FACE_NORMAL[up]
  const r = cross(u, n)
  const [na, ua, ra] = [axisOf(n), axisOf(u), axisOf(r)]
  const rows = dims[ua]!
  const cols = dims[ra]!
  const along = (v: Vec3, axis: number) => layerCoords(dims[axis]!).map((c) => c * v[axis]!)
  // Rows from the top: up's coordinate going down; columns going right.
  const downs = [...along(u, ua)].reverse()
  const rights = along(r, ra)
  const cells: string[] = []
  for (const y of downs) {
    for (const x of rights) {
      const p: [number, number, number] = [0, 0, 0]
      p[na] = outerCoord(dims[na]!, n[na]! > 0 ? 1 : -1)
      p[ua] = y
      p[ra] = x
      cells.push(stickerId(p, normalIndex(n)))
    }
  }
  return { rows, cols, cells }
}

/** Whether a puzzle can be scanned: a plain grid cube painted by its
 *  colors (no model of its own building or entering it otherwise, no
 *  shifting). A cuboid's faces are not all alike, some with a center and
 *  some without: not yet (AMELIORATIONS.md). */
export function scannable(shape: CubeShape): boolean {
  const model = MODELS[shape]
  if (model?.solved || model?.entry || isGridless(shape) || SHAPE_SHIFTS[shape]) return false
  const [x, y, z] = SHAPE_DIMS[shape]
  return x >= 2 && x === y && y === z
}

/** Whether a puzzle's faces each have a center, which tells each face. */
export const hasCenters = (shape: CubeShape): boolean =>
  scanPlan(shape).every((face) => face.center !== null)

const PLANS = new Map<CubeShape, readonly ScanFace[]>()

/** A puzzle's faces to scan, in order (see `scannable`). */
export function scanPlan(shape: CubeShape): readonly ScanFace[] {
  let plan = PLANS.get(shape)
  if (!plan) {
    const colors = faceColorsOf(shape)
    plan = ORDER.map(({ front, up, move }) => {
      const { rows, cols, cells } = faceCells(shape, front, up)
      return {
        front,
        up,
        move,
        frontColor: colors[front],
        upColor: colors[up],
        rows,
        cols,
        cells,
        center: rows % 2 && cols % 2 ? (rows * cols - 1) / 2 : null,
      }
    })
    PLANS.set(shape, plan)
  }
  return plan
}
