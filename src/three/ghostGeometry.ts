import { solvedCube } from '@/lib/cube'
import { FACE_NORMAL, normalIndex, PLANE_NORMALS } from '@/lib/geometry'
import { ghostDirection, ghostSlot } from '@/lib/ghost'
import { colorsOf } from '@/lib/pieces'
import type { Cubie, Face, Vec3 } from '@/lib/types'
import { face, type P3, type PiecePolygon } from './polygons'

/**
 * Geometry of the Floppy Ghost's pieces (see lib/ghost.ts): the square
 * plate cut by the pentagram, each piece its region of the square, as thick
 * as the plate. A piece is drawn as it sits at home, then moved by the
 * turns that brought it where it is: a rotation of the pentagram (a fifth
 * of a turn at a time) or a flip about one of its axes, which lays it on
 * its back. Everything is in the pentagram's frame, its center at the
 * origin: the axes the turns go about all pass through it.
 *
 * The pentagram is slanted (its top cut 9 degrees off the square's top)
 * and a little below the square's center, as on fan2cube's picture: no
 * piece is then the same either way up, so a piece lying the wrong way
 * always shows.
 */

/** Half the square's side, and half its thickness. */
const HALF = 1.5
const DEPTH = 0.5
/** Where the pentagram's center lies in the square (from the square's center). */
const CENTER: readonly [number, number] = [0, -0.15]
/** From the pentagram's center to each of its cuts. */
const RHO = 0.8
/** Each piece pulled in from its cuts, leaving dark seams between them. */
const INSET = 0.012
/** Share of a face its sticker covers. */
const STICKER_SCALE = 0.9

type P2 = readonly [number, number]

/** Side k's outward direction, 81 - 72k degrees (its turn's axis). */
const sideAngle = (k: number) => ((81 - 72 * k) * Math.PI) / 180

/** The square, in the pentagram's frame. */
const SQUARE: P2[] = [
  [-HALF, -HALF],
  [HALF, -HALF],
  [HALF, HALF],
  [-HALF, HALF],
].map(([x, y]) => [x! - CENTER[0], y! - CENTER[1]])

/** Keep the part of a convex polygon where `side(p) >= 0`. */
function clip(polygon: readonly P2[], side: (p: P2) => number): P2[] {
  const out: P2[] = []
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!
    const [sa, sb] = [side(a), side(b)]
    if (sa >= 0) out.push(a)
    if (sa >= 0 !== sb >= 0) {
      const t = sa / (sa - sb)
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
    }
  })
  return out
}

/** How far a point lies beyond side k's cut. */
const beyond = (k: number) => (p: P2) =>
  p[0] * Math.cos(sideAngle(k)) + p[1] * Math.sin(sideAngle(k)) - RHO

/** The region of slot m (or the center, -1): beyond its cuts, within the others. */
function region(m: number): P2[] {
  const cuts = m < 0 ? [] : m % 2 === 0 ? [m / 2] : [(m - 1) / 2, ((m + 1) / 2) % 5]
  let polygon = SQUARE
  for (let k = 0; k < 5; k++) {
    const side = beyond(k)
    polygon = clip(polygon, cuts.includes(k) ? side : (p) => -side(p))
  }
  return polygon
}

/** The square's side an edge of a region lies on, if any. */
function squareSide(a: P2, b: P2): Face | undefined {
  const sides: [Face, 0 | 1, number][] = [
    ['R', 0, HALF - CENTER[0]],
    ['L', 0, -HALF - CENTER[0]],
    ['U', 1, HALF - CENTER[1]],
    ['D', 1, -HALF - CENTER[1]],
  ]
  return sides.find(
    ([, axis, v]) => Math.abs(a[axis] - v) < 1e-9 && Math.abs(b[axis] - v) < 1e-9,
  )?.[0]
}

/** The square's sides slot m's region reaches (the model's stickers must
 *  say the same, which tests/unit/ghostGeometry.test.ts checks). */
export function ghostSquareSides(m: number): Face[] {
  const polygon = region(m)
  return polygon.flatMap((a, i) => squareSide(a, polygon[(i + 1) % polygon.length]!) ?? [])
}

/** The same convex polygon, each edge pulled in by `d`. */
function inset(polygon: readonly P2[], d: number): P2[] {
  const n = polygon.length
  const lines = polygon.map((a, i) => {
    const b = polygon[(i + 1) % n]!
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
    const length = Math.hypot(dx, dy)
    // Counterclockwise: the inside is on the left.
    const normal: P2 = [-dy / length, dx / length]
    return { point: [a[0] + normal[0] * d, a[1] + normal[1] * d] as P2, dir: [dx, dy] as P2 }
  })
  return lines.map((line, i) => {
    const prev = lines[(i + n - 1) % n]!
    const cross = prev.dir[0] * line.dir[1] - prev.dir[1] * line.dir[0]
    const t =
      ((line.point[0] - prev.point[0]) * line.dir[1] -
        (line.point[1] - prev.point[1]) * line.dir[0]) /
      cross
    return [prev.point[0] + t * prev.dir[0], prev.point[1] + t * prev.dir[1]]
  })
}

/** How a piece stands: a rotation of the pentagram by `turns` fifths, or
 *  (`flipped`) a half turn about side `turns`' axis. */
interface Placing {
  readonly flipped: boolean
  readonly turns: number
}

const mod = (a: number, n: number) => ((a % n) + n) % n

/** A plane direction index moved by a placing (see lib/ghost.ts). */
const moveDirection = (j: number, { flipped, turns }: Placing) =>
  flipped ? mod(9 - 8 * turns - j, 20) : mod(j + 4 * turns, 20)

/** A point moved by a placing. */
function movePoint([x, y, z]: P3, { flipped, turns }: Placing): P3 {
  if (!flipped) {
    const angle = (2 * Math.PI * turns) / 5
    const [c, s] = [Math.cos(angle), Math.sin(angle)]
    return [x * c - y * s, x * s + y * c, z]
  }
  // Reflected about the axis, front and back swapped.
  const [c, s] = [Math.cos(2 * sideAngle(turns)), Math.sin(2 * sideAngle(turns))]
  return [x * c + y * s, x * s - y * c, -z]
}

const SOLVED = solvedCube('ghost')

/** Where a piece belongs (its slot, -1 for the center) and how it stands. */
function placingOf(cubie: Cubie): { home: number; placing: Placing } {
  const now = ghostSlot(cubie.position)
  if (now === undefined) return { home: -1, placing: { flipped: false, turns: 0 } }
  // The piece of that kind wearing these colors (two pairs of an edge and
  // a corner wear the same).
  const home = SOLVED.map((c) => ghostSlot(c.position)).find(
    (m, i) => m !== undefined && m % 2 === now % 2 && colorsOf(SOLVED[i]!) === colorsOf(cubie),
  )!
  const front = cubie.stickers.find((s) => s.color === 'G')!
  const flipped = front.normal[2] < 0
  // A fifth of a turn moves a slot two back; a flip about side k sends m to 4k - m.
  const turns = flipped
    ? [0, 1, 2, 3, 4].find((k) => mod(4 * k - home, 10) === now)!
    : mod((home - now) / 2, 5)
  return { home, placing: { flipped, turns } }
}

/** Every polygon of a Floppy Ghost piece, as it stands. */
export function ghostPolygons(cubie: Cubie): PiecePolygon[] {
  const { home, placing } = placingOf(cubie)
  const outline = region(home)
  const inner = inset(outline, INSET)
  const at = (p: P2, z: number) => movePoint([p[0], p[1], z], placing)
  const facing = (normal: Vec3): number => {
    const j = ghostDirection(normal)
    return normalIndex(j === undefined ? normal : PLANE_NORMALS[moveDirection(j, placing)]!)
  }
  // The front and the back, swapped on a piece lying on its back.
  const flat = (z: 1 | -1): PiecePolygon[] => {
    const normal: Vec3 = [0, 0, placing.flipped ? -z : z]
    const points = (z > 0 ? inner : [...inner].reverse()).map((p) => at(p, z * DEPTH))
    return face(points, [...normal] as P3, cubie, normalIndex(normal), STICKER_SCALE)
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
