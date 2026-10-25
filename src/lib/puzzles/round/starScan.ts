import { HEX_NORMALS } from '../../core/geometry'
import type { StarShape } from '../../core/shapes'
import type { Color, Vec3 } from '../../core/types'
import type { FlatFace, FlatScan } from '../../editor/scan/plan'
import { STAR_BOTTOM, STAR_SLOTS, STAR_TOP, starToCartesian, VALLEY_COLORS } from './star'

/**
 * How a camera scans a star prism (lib/editor/scan/plan.ts, `flat`): a
 * side, a valley toward the lens; the opposite side, turned half round (a
 * 4-star: two more sides, each a third of a turn left); the top, tilted
 * toward the lens; the bottom, turned half round. Seen across a valley, a side shows the two faces of that
 * valley and, beyond the points around it, a face of each next point (the
 * faces a third of the way round lean too far, behind the points): every
 * point shows a side on one of the two pictures, which with its top or
 * bottom (on the outer layers) or its other side tells it; a 4-star's
 * inner points show no top, so its sides are seen all round. Shown to a
 * camera facing the user, a 4-star turns the other way round.
 */

const UP: Vec3 = [0, 1, 0]
const DOWN: Vec3 = [0, -1, 0]

/** The slot a piece stands at (its direction, whatever its layer), or -1
 *  (the screw). */
const slotAt = ([q, , r]: Vec3) => STAR_SLOTS.findIndex(([a, b]) => a === q && b === r)
const valleyOf = (normal: Vec3) => HEX_NORMALS.findIndex((n) => n.join() === normal.join())

/** Where a top or bottom sticker shows: a point's kite out from the
 *  middle, the screw's half disc near it. The inner layers' (a 4-star's,
 *  covered) never. */
const onFlat =
  (side: Vec3) =>
  ([q, y, r]: Vec3, normal: Vec3): number[] | null => {
    if (normal.join() !== side.join() || Math.abs(y) === 1) return null
    const out = y ? 0.7 : 0.25
    return [q * out, y, r * out]
  }

/** Where a side sticker shows, seen across valley `j`: the faces of valley
 *  j (its two points'), of the next valley the next point's, of the one
 *  before the point before. */
const across =
  (j: number) =>
  (position: Vec3, normal: Vec3): number[] | null => {
    const [slot, valley] = [slotAt(position), valleyOf(normal)]
    const at = (k: number) => (k + 6) % 6
    const seen =
      (valley === j && (slot === j || slot === at(j + 1))) ||
      (valley === at(j + 1) && slot === at(j + 2)) ||
      (valley === at(j - 1) && slot === at(j - 1))
    if (!seen) return null
    // Halfway out along its face, toward the valley.
    return position.map((x, a) => x + 0.4 * normal[a]!)
  }

/** A half turn; a third of a turn; a tilt. */
const HALF = 180
const THIRD = 120
const QUARTER = 90

/** The valley a turn left by a third brings in front of the lens after
 *  valley `j` (the one on its right; on its left, to a camera facing the
 *  user). */
function nextValley(j: number, behind: boolean): number {
  const [x, , z] = starToCartesian(HEX_NORMALS[j]!)
  const ahead = (j + 2) % 6
  const [ax, , az] = starToCartesian(HEX_NORMALS[ahead]!)
  // Right of a valley seen from outside, up being up: (z, 0, -x).
  return z * ax - x * az > 0 !== behind ? ahead : (j + 4) % 6
}

/** The 2-star across two opposite valleys, a half turn apart; the 4-star,
 *  whose inner points show no top, across three a third of a turn apart
 *  (every side face seen). Then the top and the bottom. */
function faces(shape: StarShape, behind: boolean): FlatFace[] {
  const valleys = [0]
  if (shape === 'star') valleys.push(3)
  else valleys.push(nextValley(0, behind), nextValley(nextValley(0, behind), behind))
  const sides = valleys.map((j, k): FlatFace => ({
    normal: HEX_NORMALS[j]!,
    up: UP,
    pointDown: true,
    sides: 4,
    frontColor: VALLEY_COLORS[j]!,
    upColor: STAR_TOP,
    shown: across(j),
    ...(k === 0
      ? { move: 'first' as const }
      : shape === 'star'
        ? { move: 'flip' as const, angle: HALF }
        : { move: 'turn' as const, angle: THIRD }),
  }))
  // Tilted toward the lens: the top in front, the side that was at the
  // back on top.
  const back = (valleys[valleys.length - 1]! + 3) % 6
  const flat = (normal: Vec3, frontColor: Color, move: 'tilt' | 'flip'): FlatFace => ({
    normal,
    up: HEX_NORMALS[back]!,
    sides: 6,
    frontColor,
    upColor: VALLEY_COLORS[back]!,
    move,
    angle: move === 'tilt' ? QUARTER : HALF,
    shown: onFlat(normal),
  })
  return [...sides, flat(UP, STAR_TOP, 'tilt'), flat(DOWN, STAR_BOTTOM, 'flip')]
}

/** A star prism's scan (see above). */
export const starScan = (shape: StarShape): FlatScan => ({
  flat: (behind) => faces(shape, behind),
  solid: 'prism',
})
