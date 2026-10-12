import { HEX_NORMALS } from '@/lib/geometry'
import { starToCartesian } from '@/lib/star'
import type { Cubie, Vec3 } from '@/lib/types'
import { colorFacing, face, type P3, type PiecePolygon } from './polygons'

/**
 * Geometry of the star prism's pieces, in the star's cartesian frame (see
 * `starToCartesian`), shared by the 3D view and the picker thumbnail. A point
 * of the star is a kite (center, valley vertex, tip, valley vertex) extruded
 * over its layer; its outer faces carry the colors of its stickers, found by
 * the direction they face. The screw halves are half discs on top and below.
 * The 4-star stacks two more layers inside: its pieces are drawn the same,
 * except the inner points' flat faces, always hidden (plastic only).
 */

/** Distance from the center to a tip, and to a valley's inner vertex: a
 *  point opens at about 72 degrees, blunter than a regular hexagram's 60. */
const TIP = 1.45
const VALLEY = 0.93
/** Height of a layer, and the gap between the two. */
const LAYER = 0.62
const GAP = 0.04
/** Radius of the screw's half discs: the plastic rim, then the sticker. */
const SCREW = 0.44
const SCREW_STICKER = 0.35
const unit = ([x, , z]: P3): P3 => {
  const length = Math.hypot(x, z)
  return [x / length, 0, z / length]
}
const scale = ([x, y, z]: P3, k: number): P3 => [x * k, y * k, z * k]
const at = ([x, , z]: P3, y: number): P3 => [x, y, z]

/** Horizontal direction of a slot (a star point) and of a valley. */
const SLOT_DIRECTIONS: readonly P3[] = [
  [1, 0, 0],
  [1, 0, -1],
  [0, 0, -1],
  [-1, 0, 0],
  [-1, 0, 1],
  [0, 0, 1],
].map((v) => unit(starToCartesian(v as unknown as Vec3)))
const VALLEY_DIRECTIONS: readonly P3[] = HEX_NORMALS.map((n) => unit(starToCartesian(n)))

function slotOf([q, , r]: Vec3): number {
  const axial = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ]
  return axial.findIndex(([a, b]) => a === q && b === r)
}

/** Vertical extent of a layer (seen from its side of the screw): its inner
 *  face then its outer one. On a 2-star the outer points (y = +-2) take the
 *  first layer; on a 4-star the second, past the inner points (y = +-1). */
function layerSpan(y: number, tall: boolean): [number, number] {
  const band = tall && Math.abs(y) === 2 ? 1 : 0
  const inner = GAP / 2 + band * (LAYER + GAP)
  return [inner, inner + LAYER]
}

function pointPolygons(cubie: Cubie, tall: boolean): PiecePolygon[] {
  const k = slotOf(cubie.position)
  const up = cubie.position[1] > 0
  const [near, far] = layerSpan(cubie.position[1], tall)
  const [outerY, innerY] = up ? [far, near] : [-far, -near]
  const exposed = Math.abs(cubie.position[1]) === 2
  const a = scale(VALLEY_DIRECTIONS[(k + 5) % 6]!, VALLEY)
  const t = scale(SLOT_DIRECTIONS[k]!, TIP)
  const b = scale(VALLEY_DIRECTIONS[k]!, VALLEY)
  const o: P3 = [0, 0, 0]
  const kite = (y: number): P3[] => [at(o, y), at(a, y), at(t, y), at(b, y)]
  const side = (p: P3, q: P3): P3[] => [at(p, innerY), at(q, innerY), at(q, outerY), at(p, outerY)]
  const outward = (p: P3, q: P3): P3 => unit([q[2] - p[2], 0, -(q[0] - p[0])])
  const flatNormal: P3 = [0, up ? 1 : -1, 0]
  const left = outward(a, t)
  const right = outward(t, b)
  // Orient the side normals away from the center.
  const away = (n: P3, p: P3): P3 => (n[0] * p[0] + n[2] * p[2] >= 0 ? n : scale(n, -1))
  const inwardFlat: P3 = [0, up ? -1 : 1, 0]
  return [
    // The inner faces close the piece (plastic only): no seeing through the gaps.
    ...face(kite(innerY), inwardFlat),
    ...face(side(o, a), away(outward(o, a), scale(a, -1))),
    ...face(side(b, o), away(outward(b, o), scale(b, -1))),
    ...face(kite(outerY), flatNormal, exposed ? cubie : undefined, up ? 2 : 3),
    ...face(side(a, t), away(left, t), cubie, 6 + ((k + 5) % 6)),
    ...face(side(t, b), away(right, t), cubie, 6 + k),
  ]
}

function screwPolygons(cubie: Cubie, tall: boolean): PiecePolygon[] {
  const top = layerSpan(2, tall)[1]
  const direction = unit(starToCartesian(cubie.position))
  const middle = Math.atan2(direction[2], direction[0])
  /** A half disc on the side of `direction`, pushed off the split line by
   *  `shift` (which leaves a dark seam between the two halves). */
  const half = (radius: number, y: number, shift: number): P3[] => {
    const [cx, cz] = [direction[0] * shift, direction[2] * shift]
    return [
      [cx, y, cz],
      ...Array.from({ length: 17 }, (_, i): P3 => {
        const angle = middle - Math.PI / 2 + (i * Math.PI) / 16
        return [cx + Math.cos(angle) * radius, y, cz + Math.sin(angle) * radius]
      }),
    ]
  }
  // Raised above the points, with a plastic rim around the colored half.
  const rise = 0.02
  const side = (up: boolean): PiecePolygon[] => {
    const y = up ? top + rise : -top - rise
    const normal: P3 = [0, up ? 1 : -1, 0]
    const ni = up ? 2 : 3
    const color = colorFacing(cubie, ni)
    const lifted = up ? y + 0.004 : y - 0.004
    return [
      { points: half(SCREW, y, 0), paint: 'body', normal },
      ...(color ? [{ points: half(SCREW_STICKER, lifted, 0.04), paint: color, normal, ni }] : []),
    ]
  }
  return [...side(true), ...side(false)]
}

/** Every visible polygon of a star prism piece (a point or a screw half);
 *  `tall` for the 4-star. */
export function starPolygons(cubie: Cubie, tall: boolean): PiecePolygon[] {
  return cubie.position[1] === 0 ? screwPolygons(cubie, tall) : pointPolygons(cubie, tall)
}

/** The star's yaw on screen: the slash plane faces the viewer, its turning
 *  half on the right. */
export const STAR_YAW = -Math.PI / 3
