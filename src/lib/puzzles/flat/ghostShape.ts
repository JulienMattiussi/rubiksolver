import { colorsOf } from '../../core/pieces'
import type { Cubie, Face } from '../../core/types'
import { clip, inset, type P2 } from '../../core/plane'
import { GHOST_TOP_AXIS, ghostSlot, solvedGhost } from './ghost'
import { mod } from '../../core/geometry'

/**
 * The Floppy Ghost's shape, flat (pure): the square plate cut by the
 * pentagram, each piece its region of the square, and how a piece stands
 * (see ghost.ts): a rotation of the pentagram (a fifth of a turn at a time)
 * or a flip about one of its axes, which lays it on its back. Everything is
 * in the pentagram's frame, its center at the origin: the axes the turns go
 * about all pass through it. Its drawing (three/puzzles/flat/ghostGeometry.ts)
 * extrudes it; its scan reads it from a picture.
 *
 * The pentagram is slanted (its top cut 5 degrees off the square's top):
 * no piece is then the same either way up, so a piece lying the wrong way
 * always shows. Its slant, size and place are measured on the real puzzle
 * (a 55 mm square, its cuts traced on a photo, a regular pentagram to a
 * hundredth of the square): its center a hair below the square's.
 */

/** Half the square's side. */
const HALF = 1.5
/** Where the pentagram's center lies in the square (from the square's center). */
const CENTER: readonly [number, number] = [0, -0.02]
/** From the pentagram's center to each of its cuts. */
const RHO = 0.84

export type P3 = readonly [number, number, number]

/** Side k's outward direction (its turn's axis). */
const sideAngle = (k: number) => ((GHOST_TOP_AXIS - 72 * k) * Math.PI) / 180

/** The square, in the pentagram's frame. */
const SQUARE: P2[] = [
  [-HALF, -HALF],
  [HALF, -HALF],
  [HALF, HALF],
  [-HALF, HALF],
].map(([x, y]) => [x! - CENTER[0], y! - CENTER[1]])

/** How far a point lies beyond side k's cut. */
const beyond = (k: number) => (p: P2) =>
  p[0] * Math.cos(sideAngle(k)) + p[1] * Math.sin(sideAngle(k)) - RHO

/** The region of slot m (or the center, -1): beyond its cuts, within the others. */
export function region(m: number): P2[] {
  const cuts = m < 0 ? [] : m % 2 === 0 ? [m / 2] : [(m - 1) / 2, ((m + 1) / 2) % 5]
  let polygon = SQUARE
  for (let k = 0; k < 5; k++) {
    const side = beyond(k)
    polygon = clip(polygon, cuts.includes(k) ? side : (p) => -side(p))
  }
  return polygon
}

/** How far along its cut each way a seam is looked for on a picture,
 *  from its foot: past the square's corners at most. */
const SEAM_REACH = 2

/** The pentagram's five cuts, which every state is cut along (a turn takes
 *  the cuts to the cuts): each a segment through its foot, in the
 *  pentagram's frame. */
export function ghostSeams(): [P2, P2][] {
  return [0, 1, 2, 3, 4].map((k) => {
    const [c, s] = [Math.cos(sideAngle(k)), Math.sin(sideAngle(k))]
    return [
      [RHO * c + SEAM_REACH * s, RHO * s - SEAM_REACH * c],
      [RHO * c - SEAM_REACH * s, RHO * s + SEAM_REACH * c],
    ]
  })
}

/** The square's side an edge of a region lies on, if any. */
export function squareSide(a: P2, b: P2): Face | undefined {
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
 *  say the same, which tests/unit/puzzles/flat/ghostGeometry.test.ts checks). */
export function ghostSquareSides(m: number): Face[] {
  const polygon = region(m)
  return polygon.flatMap((a, i) => squareSide(a, polygon[(i + 1) % polygon.length]!) ?? [])
}

/** How a piece stands: a rotation of the pentagram by `turns` fifths, or
 *  (`flipped`) a half turn about side `turns`' axis. */
export interface Placing {
  readonly flipped: boolean
  readonly turns: number
}

/** A plane direction index moved by a placing (see lib/puzzles/flat/ghost.ts). */
export const moveDirection = (j: number, { flipped, turns }: Placing) =>
  flipped ? mod(9 - 8 * turns - j, 20) : mod(j + 4 * turns, 20)

/** A point moved by a placing. */
export function movePoint([x, y, z]: P3, { flipped, turns }: Placing): [number, number, number] {
  if (!flipped) {
    const angle = (2 * Math.PI * turns) / 5
    const [c, s] = [Math.cos(angle), Math.sin(angle)]
    return [x * c - y * s, x * s + y * c, z]
  }
  // Reflected about the axis, front and back swapped.
  const [c, s] = [Math.cos(2 * sideAngle(turns)), Math.sin(2 * sideAngle(turns))]
  return [x * c + y * s, x * s - y * c, -z]
}

// Its model's (not solvedCube's: the models are not all loaded yet when
// a model's scan loads this).
const SOLVED = solvedGhost()

/** Where a piece belongs (its slot, -1 for the center) and how it stands. */
export function placingOf(cubie: Cubie): { home: number; placing: Placing } {
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

/** How far a sticker lies inside its piece's edges: along a cut (half the
 *  black seam between two stickers), and along the square's sides (its
 *  rim, thinner). Measured on a sharp photo of the real puzzle (480 px):
 *  a seam 3.5 mm wide, a rim 1.4 mm, on a 55 mm plate (3 units). */
export const GHOST_BORDER = 0.095
const GHOST_RIM = 0.075

/** The bumps of the black body midway along each side of the pentagon
 *  (where a turn latches), across the cut: an ellipse on the cut, this
 *  long each way along it and this far each way across, biting into the
 *  pentagon's sticker and its edge's (about 0.7 mm beyond the seam: an
 *  oval, longer than it is deep). */
const NOTCH_ALONG = 0.15
const NOTCH_ACROSS = GHOST_BORDER + 0.04
/** Points along a notch's curve. */
const NOTCH_POINTS = 12

/** A convex sticker with the notch of cut k bitten out of its side along
 *  that cut: that side's stretch inside the ellipse replaced by its curve. */
function notched(sticker: readonly P2[], k: number): P2[] {
  const [c, s] = [Math.cos(sideAngle(k)), Math.sin(sideAngle(k))]
  const middle: P2 = [RHO * c, RHO * s]
  const along: P2 = [-s, c]
  return sticker.flatMap((a, i): P2[] => {
    const b = sticker[(i + 1) % sticker.length]!
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const dir: P2 = [(b[0] - a[0]) / length, (b[1] - a[1]) / length]
    // Not along the cut, or too far from it: kept as it is.
    const gap = (a[0] - middle[0]) * dir[1] - (a[1] - middle[1]) * dir[0]
    if (Math.abs(dir[0] * along[1] - dir[1] * along[0]) > 1e-6 || Math.abs(gap) >= NOTCH_ACROSS)
      return [a]
    // Across the cut, towards this side (and the sticker beyond it).
    const away: P2 = gap > 0 ? [dir[1], -dir[0]] : [-dir[1], dir[0]]
    const low = Math.asin(Math.abs(gap) / NOTCH_ACROSS)
    const curve = Array.from({ length: NOTCH_POINTS + 1 }, (_, j): P2 => {
      const t = low + ((Math.PI - 2 * low) * j) / NOTCH_POINTS
      const [x, y] = [NOTCH_ALONG * Math.cos(t), NOTCH_ACROSS * Math.sin(t)]
      return [middle[0] + along[0] * x + away[0] * y, middle[1] + along[1] * x + away[1] * y]
    })
    const from = (p: P2) => (p[0] - a[0]) * dir[0] + (p[1] - a[1]) * dir[1]
    return [
      a,
      ...curve.filter((p) => from(p) > 0 && from(p) < length).sort((p, q) => from(p) - from(q)),
    ]
  })
}

/** Slot m's sticker (the center's, -1) at home: its region pulled in from
 *  its cuts and from the square's sides; `notches`, with the bumps of the
 *  body bitten out of it (the center's five, an edge's one: the cut it
 *  shares with the pentagon), then no longer convex. */
export function ghostSticker(m: number, notches = false): P2[] {
  const outline = region(m)
  const sticker = inset(outline, (i) =>
    squareSide(outline[i]!, outline[(i + 1) % outline.length]!) ? GHOST_RIM : GHOST_BORDER,
  )
  if (!notches || m % 2 === 1) return sticker
  const cuts = m < 0 ? [0, 1, 2, 3, 4] : [m / 2]
  return cuts.reduce(notched, sticker)
}

/** A piece as it stands, seen from the front: its outline, and its
 *  sticker (counterclockwise both). */
export function ghostPose(cubie: Cubie): { outline: P2[]; sticker: P2[] } {
  const { home, placing } = placingOf(cubie)
  const outline = region(home)
  const sticker = ghostSticker(home)
  const moved = (polygon: readonly P2[]) => {
    const points = polygon.map((p): P2 => {
      const [x, y] = movePoint([p[0], p[1], 0], placing)
      return [x, y]
    })
    // A flip reverses the turn of a polygon: counterclockwise again.
    return placing.flipped ? points.reverse() : points
  }
  return { outline: moved(outline), sticker: moved(sticker) }
}
