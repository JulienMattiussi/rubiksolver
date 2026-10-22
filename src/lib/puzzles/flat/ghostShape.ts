import { colorsOf } from '../../core/pieces'
import type { Cubie, Face } from '../../core/types'
import { clip, type P2 } from '../../core/plane'
import { ghostSlot, solvedGhost } from './ghost'

/**
 * The Floppy Ghost's shape, flat (pure): the square plate cut by the
 * pentagram, each piece its region of the square, and how a piece stands
 * (see ghost.ts): a rotation of the pentagram (a fifth of a turn at a time)
 * or a flip about one of its axes, which lays it on its back. Everything is
 * in the pentagram's frame, its center at the origin: the axes the turns go
 * about all pass through it. Its drawing (three/puzzles/flat/ghostGeometry.ts)
 * extrudes it; its scan reads it from a picture.
 *
 * The pentagram is slanted (its top cut 9 degrees off the square's top)
 * and a little below the square's center, as on fan2cube's picture: no
 * piece is then the same either way up, so a piece lying the wrong way
 * always shows.
 */

/** Half the square's side. */
const HALF = 1.5
/** Where the pentagram's center lies in the square (from the square's center). */
const CENTER: readonly [number, number] = [0, -0.15]
/** From the pentagram's center to each of its cuts. */
const RHO = 0.8

export type P3 = readonly [number, number, number]

/** Side k's outward direction, 81 - 72k degrees (its turn's axis). */
const sideAngle = (k: number) => ((81 - 72 * k) * Math.PI) / 180

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

const mod = (a: number, n: number) => ((a % n) + n) % n

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

/** A piece's outline as it stands, seen from the front. */
export function ghostOutline(cubie: Cubie): P2[] {
  const { home, placing } = placingOf(cubie)
  const outline = region(home).map((p) => movePoint([p[0], p[1], 0], placing))
  // A flip reverses the turn of the outline: counterclockwise again.
  const points = outline.map(([x, y]): P2 => [x, y])
  return placing.flipped ? points.reverse() : points
}
