import { MARK } from '@/lib/core/types'
import { FACE_NORMAL, normalIndex } from '@/lib/core/geometry'
import { arrowOn, type ArrowWay } from '@/lib/puzzles/twisted/latch'
import { FACE_COLOR } from '@/lib/core/cube'
import type { Color, Cubie, Face, Sticker } from '@/lib/core/types'
import { face, onFace, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Latch Cube's pieces (lib/puzzles/twisted/latch.ts): a
 * 3x3's cubies, each face printed with a circle about its middle through
 * its edges' stickers (a share of it on each sticker around the center),
 * and on the sticker of each edge that wears one, an arrow along it: white
 * (clockwise) or black (counterclockwise), as on the real puzzle.
 */

const SHRINK = 0.97
const STICKER_SCALE = 0.86
/** The circle: its radius (through the edges' middles) and half its width. */
const RADIUS = 1
const WIDTH = 0.035
/** Half a sticker's side: the circle is drawn within it. */
const HALF = 0.5 * SHRINK * STICKER_SCALE

/** Where the face's middle stands from the piece, across the face. */
function faceMiddle(position: readonly number[], n: readonly number[]): [number, number] {
  const a = n.findIndex((v) => v !== 0)
  const [b, c] = [(a + 1) % 3, (a + 2) % 3]
  return [-position[b]!, -position[c]! * n[a]!]
}

/** Whether a point lies on the sticker, `margin` past its sides. */
const inside = (u: number, v: number, margin = 0) =>
  Math.abs(u) <= HALF + margin && Math.abs(v) <= HALF + margin

/** A polygon cut to the sticker's square, side by side
 *  (Sutherland-Hodgman): what is left (a convex one stays convex). */
function clipped(polygon: readonly [number, number][]): [number, number][] {
  let out = [...polygon]
  for (const [axis, sign] of [
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
  ] as const) {
    const within = (p: readonly [number, number]) => sign * p[axis] <= HALF
    const input = out
    out = []
    input.forEach((p, i) => {
      const q = input[(i + 1) % input.length]!
      if (within(p)) out.push(p)
      if (within(p) !== within(q)) {
        const t = (sign * HALF - p[axis]) / (q[axis] - p[axis])
        out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])])
      }
    })
  }
  return out
}

/** The paint of a way: white clockwise, black counterclockwise. */
const PAINT: Record<ArrowWay, PiecePolygon['paint']> = { cw: 'W', ccw: 'body' }

/** The way the arrows of a sticker's own face go (its color's face, as
 *  solved): its share of the circle is printed in their color. */
function wayOf(color: Color): ArrowWay {
  const face = (Object.keys(FACE_COLOR) as Face[]).find((f) => FACE_COLOR[f] === color)
  return face === 'U' || face === 'F' || face === 'L' ? 'ccw' : 'cw'
}

/** A band along the face's circle, between two angles, from `r1` to `r2`
 *  off its middle: quads every two degrees, those within the sticker. */
function band(
  point: (u: number, v: number) => P3,
  normal: P3,
  [cu, cv]: readonly [number, number],
  [r1, r2]: readonly [number, number],
  [from, to]: readonly [number, number],
  paint: PiecePolygon['paint'],
): PiecePolygon[] {
  const out: PiecePolygon[] = []
  const steps = Math.max(1, Math.ceil(Math.abs(to - from) / (Math.PI / 90)))
  for (let k = 0; k < steps; k++) {
    const [t0, t1] = [k, k + 1].map((i) => from + ((to - from) * i) / steps) as [number, number]
    const ends: [number, number][] = [
      [cu + r1 * Math.cos(t0), cv + r1 * Math.sin(t0)],
      [cu + r2 * Math.cos(t0), cv + r2 * Math.sin(t0)],
      [cu + r2 * Math.cos(t1), cv + r2 * Math.sin(t1)],
      [cu + r1 * Math.cos(t1), cv + r1 * Math.sin(t1)],
    ]
    const kept = clipped(ends)
    if (kept.length < 3) continue
    const points = kept.map(([u, v]) => point(u, v))
    out.push({ points: to > from ? points : points.reverse(), paint, normal })
  }
  return out
}

/** The share of the face's circle on a sticker, in its face's color. */
function circle(cubie: Cubie, s: Sticker): PiecePolygon[] {
  const n = s.normal
  const middle = faceMiddle(cubie.position, n)
  if (middle[0] === 0 && middle[1] === 0) return [] // the center: the circle goes round it
  const normal = [...n] as P3
  const whole: [number, number] = [0, 2 * Math.PI]
  const way = wayOf(s.color)
  return band(
    onFace(cubie.position, n, 0.006),
    normal,
    middle,
    [RADIUS - WIDTH, RADIUS + WIDTH],
    whole,
    PAINT[way],
  )
}

/** The share of the face's circle on a sticker in one piece, printed on it
 *  (for the thumbnail's SVG, which takes any polygon): along it from one
 *  side of the sticker to the other, out then back, cut to the sticker. */
function circlePrint(cubie: Cubie, s: Sticker): PiecePolygon[] {
  const n = s.normal
  const [cu, cv] = faceMiddle(cubie.position, n)
  if (cu === 0 && cv === 0) return []
  const at = Math.atan2(-cv, -cu)
  const on = (t: number) => inside(cu + RADIUS * Math.cos(t), cv + RADIUS * Math.sin(t), WIDTH)
  // The run of angles about the sticker's own that crosses it.
  const step = Math.PI / 180
  let [from, to] = [at, at]
  while (from > at - Math.PI && on(from - step)) from -= step
  while (to < at + Math.PI && on(to + step)) to += step
  const arc = (r: number) =>
    Array.from({ length: Math.round((to - from) / step) + 3 }, (_, k): [number, number] => {
      const t = from - step + k * step
      return [cu + r * Math.cos(t), cv + r * Math.sin(t)]
    })
  const outline = clipped([...arc(RADIUS + WIDTH), ...arc(RADIUS - WIDTH).reverse()])
  const point = onFace(cubie.position, n, 0.006)
  return [
    {
      points: outline.map(([u, v]) => point(u, v)),
      paint: PAINT[wayOf(s.color)],
      normal: [...n] as P3,
      on: true,
    },
  ]
}

/** While an edge is entered, one color painted: the arrow its sticker may
 *  wear (two of the four edges of its color wear it there), the way its
 *  color's arrows always go. */
function maybe(cubie: Cubie, s: Sticker): ArrowWay | undefined {
  const edge = cubie.stickers.length === 2
  const open = cubie.stickers.some((x) => x.color === UNPAINTED)
  return edge && open && s.color !== UNPAINTED ? wayOf(s.color) : undefined
}

/** An arrowhead, along x: its tip, a barb, the notch, the other barb. */
const OUTLINE: readonly (readonly [number, number])[] = [
  [1, 0],
  [-0.75, 0.85],
  [-0.25, 0],
  [-0.75, -0.85],
]

/** The same in two triangles (the 3D view takes convex polygons). */
const HEAD: readonly (readonly [number, number])[][] = [
  [
    [1, 0],
    [-0.75, 0.85],
    [-0.25, 0],
  ],
  [
    [1, 0],
    [-0.25, 0],
    [-0.75, -0.85],
  ],
]

/** An edge's arrow, on the sticker that wears it: an arrowhead in its
 *  middle, on the circle, pointing the way it lets the face turn; white
 *  (clockwise) or black (counterclockwise). */
function arrow(cubie: Cubie, s: Sticker, flat = false): PiecePolygon[] {
  const way = arrowOn(cubie, s) ?? maybe(cubie, s)
  if (!way) return []
  const n = s.normal
  const [cu, cv] = faceMiddle(cubie.position, n)
  const normal = [...n] as P3
  // Outwards from the face's middle, and along the circle the arrow's way
  // (counter-clockwise turns the radius a quarter that way).
  const length = Math.hypot(cu, cv)
  const [ru, rv] = [-cu / length, -cv / length]
  const sense = way === 'ccw' ? 1 : -1
  const [tu, tv] = [-rv * sense, ru * sense]
  const shape = (outline: readonly (readonly [number, number])[], size: number, lift: number) => {
    const point = onFace(cubie.position, n, lift)
    const points = outline.map(([x, y]) =>
      point(size * (x * tu + y * ru), size * (x * tv + y * rv)),
    )
    return { points: sense > 0 ? points : points.reverse(), paint: PAINT[way], normal }
  }
  // The thumbnail's SVG takes it whole, printed on its sticker; the 3D
  // view, in its two triangles.
  return flat ? [shape(OUTLINE, 0.3, 0.05)] : HEAD.map((triangle) => shape(triangle, 0.2, 0.01))
}

/** The color the editor gives a sticker not painted yet (hidden: the
 *  marks' color, which no sticker shows). */
export const UNPAINTED: Color = MARK

/** Every polygon of a piece, as it stands (the marked core: none); for
 *  the picker's thumbnail, each print whole on its sticker. */
function polygonsOf(cubie: Cubie, thumbnail: boolean): PiecePolygon[] {
  if (cubie.position.every((v) => v === 0)) return []
  // Being entered: a sticker's share of the circle once it is painted, and
  // the arrow it wears, or may wear while its edge's other color is not.
  const h = 0.5 * SHRINK
  return (Object.keys(FACE_NORMAL) as Face[]).flatMap((f) => {
    const n = FACE_NORMAL[f]
    const a = n.findIndex((v) => v !== 0)
    const [b, c] = [(a + 1) % 3, (a + 2) % 3]
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([u, v]) => {
      const p: number[] = [...cubie.position]
      p[a] = p[a]! + n[a]! * h
      p[b] = p[b]! + u! * h
      p[c] = p[c]! + v! * h * n[a]!
      return p as P3
    })
    const s = cubie.stickers.find((x) => x.normal.join() === n.join())
    // Its sticker's prints right after it.
    const prints =
      !s || s.color === UNPAINTED
        ? []
        : thumbnail
          ? [...circlePrint(cubie, s), ...arrow(cubie, s, true)]
          : [...circle(cubie, s), ...arrow(cubie, s)]
    return [...face(corners, [...n] as P3, cubie, normalIndex(n), STICKER_SCALE), ...prints]
  })
}

export const latchPolygons = (cubie: Cubie) => polygonsOf(cubie, false)
export const latchThumbnail = (cubie: Cubie) => polygonsOf(cubie, true)
