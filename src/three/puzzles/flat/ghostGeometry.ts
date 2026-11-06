import { FACE_NORMAL, normalIndex, PLANE_NORMALS } from '@/lib/core/geometry'
import { ghostDirection } from '@/lib/puzzles/flat/ghost'
import { inset, type P2 } from '@/lib/core/plane'
import {
  moveDirection,
  movePoint,
  ghostSticker,
  placingOf,
  region,
  squareSide,
} from '@/lib/puzzles/flat/ghostShape'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { colorFacing, face, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Floppy Ghost's pieces: each its region of the square
 * (lib/puzzles/flat/ghostShape.ts), as thick as the plate, drawn as it
 * sits at home, then moved by the turns that brought it where it is.
 */

/** Half the plate's thickness. */
const DEPTH = 0.5
/** Each piece pulled in from its cuts, leaving dark seams between them. */
const INSET = 0.012
/** Share of a side face its sticker covers. */
const STICKER_SCALE = 0.9
/** How far a sticker lies off its face. */
const LIFT = 0.004

/** Every polygon of a Floppy Ghost piece, as it stands. */
export function ghostPolygons(cubie: Cubie): PiecePolygon[] {
  const { home, placing } = placingOf(cubie)
  const outline = region(home)
  const inner = inset(outline, INSET)
  const at = (p: P2, z: number): P3 => movePoint([p[0], p[1], z], placing)
  const facing = (normal: Vec3): number => {
    const j = ghostDirection(normal)
    return normalIndex(j === undefined ? normal : PLANE_NORMALS[moveDirection(j, placing)]!)
  }
  // The front and the back, swapped on a piece lying on its back: its
  // sticker as on the real puzzle (its black frame, the bumps of the
  // center's body bitten out of it).
  const sticker = ghostSticker(home, true)
  const corners = ghostSticker(home)
  const middle: P2 = [
    corners.reduce((sum, p) => sum + p[0], 0) / corners.length,
    corners.reduce((sum, p) => sum + p[1], 0) / corners.length,
  ]
  const flat = (z: 1 | -1): PiecePolygon[] => {
    const normal: Vec3 = [0, 0, placing.flipped ? -z : z]
    const ni = normalIndex(normal)
    const onFace = (polygon: readonly P2[], depth: number) =>
      (z > 0 ? polygon : [...polygon].reverse()).map((p) => at(p, z * depth))
    const body = face(onFace(inner, DEPTH), [...normal] as P3)
    const color = colorFacing(cubie, ni)
    if (!color) return body
    // Notched, no longer convex but seen whole from its middle (its
    // corners' mean): a fan from there round its outline, back to its
    // first point.
    const points = onFace([middle, ...sticker, sticker[0]!], DEPTH + LIFT)
    // The fan's middle first, whichever way round.
    if (z < 0) points.unshift(points.pop()!)
    return [...body, { points, paint: color, normal: [...normal] as P3, ni }]
  }
  const polygons = [...flat(1), ...flat(-1)]
  inner.forEach((a, i) => {
    const b = inner[(i + 1) % inner.length]!
    const side = squareSide(outline[i]!, outline[(i + 1) % outline.length]!)
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
    const length = Math.hypot(dx, dy)
    const out = movePoint([dy / length, -dx / length, 0], placing)
    const ni = side ? facing(FACE_NORMAL[side]) : undefined
    polygons.push(
      ...face(
        [at(a, DEPTH), at(a, -DEPTH), at(b, -DEPTH), at(b, DEPTH)],
        out,
        cubie,
        ni,
        STICKER_SCALE,
      ),
    )
  })
  return polygons
}

/** The yaw that shows the plate: straight on (the camera's height and side
 *  already show its edges). */
export const GHOST_YAW = 0
