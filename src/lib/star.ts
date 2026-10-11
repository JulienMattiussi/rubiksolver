import { HEX_NORMALS } from './geometry'
import type { FaceLabels } from './moves'
import type { Color, Cube, Cubie, RingMove, StarMove, StarShape, Sticker, Vec3 } from './types'

/**
 * The 2-Super Star Prism (a Rubik's UFO shaped as a six-pointed star): two
 * layers of six pieces, each one point of the star, and a central screw cut
 * in two halves. Its moves (Square-1 family): turn the top or the bottom
 * layer by whole pieces (60 degrees each), or the slash, a half turn of the
 * whole right half, which swaps its three top pieces with its three bottom
 * ones and flips the right half-screw.
 *
 * The 4-Super Star Prism adds two inner layers (h and b) between them, each
 * turning on its own; the slash still cuts through everything. It sends the
 * outer layers onto each other and the inner ones onto each other, so the
 * puzzle is two 2-stars sharing a screw. An inner point shows only its two
 * sides, yet it keeps which way up it is (its two colors read left to right
 * or right to left), and the slash, which moves it to the other layer, also
 * turns it over: so it stays a "top" or a "bottom" point for good. The model
 * gives it the hidden top or bottom sticker that says so (never drawn), which
 * makes it exactly an outer point one layer in.
 *
 * Exact integer model, like the cubes: positions in axial hexagonal
 * coordinates [q, y, r], where a 60 degree turn is the integer map
 * (q, r) -> (-r, q + r). Each valley of the star (the V between two points)
 * has its own side normal (`HEX_NORMALS`), shared by the two faces forming
 * it: "solved" stays "every face direction shows one color".
 */

/** Center direction of each slot (one star point), counterclockwise seen
 *  from above. Valley k lies between slots k and k + 1. */
const SLOTS: readonly (readonly [number, number])[] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
]

/** Color of each valley (the two faces forming it): orange, white, yellow,
 *  red, violet, pink going clockwise, i.e. backwards through the slots. */
const VALLEY_COLORS: readonly Color[] = ['O', 'P', 'V', 'R', 'Y', 'W']
const TOP: Color = 'G'
const BOTTOM: Color = 'B'

/** Height of each ring's layer: the outer ones at 2, the inner ones at 1
 *  (the screw, between them, at 0). */
const RING_Y: Record<RingMove['ring'], number> = { U: 2, u: 1, d: -1, D: -2 }

/** The layers of each star prism, top to bottom. */
export const STAR_RINGS: Record<StarShape, readonly RingMove['ring'][]> = {
  star: ['U', 'D'],
  star4: ['U', 'u', 'd', 'D'],
}

const UP: Vec3 = [0, 1, 0]
const DOWN: Vec3 = [0, -1, 0]

/** The slash cuts through valleys 5 and 2: slots 0, 1 and 2 (and the screw
 *  half on their side, toward slot 1) form the right half. */
const inRightHalf = (p: Vec3): boolean => p[0] - p[2] > 0

function point(slot: number, y: number): Cubie {
  const [q, r] = SLOTS[slot]!
  const stickers: Sticker[] = [
    { normal: y > 0 ? UP : DOWN, color: y > 0 ? TOP : BOTTOM },
    { normal: HEX_NORMALS[(slot + 5) % 6]!, color: VALLEY_COLORS[(slot + 5) % 6]! },
    { normal: HEX_NORMALS[slot]!, color: VALLEY_COLORS[slot]! },
  ]
  return { position: [q, y, r], stickers }
}

/** A half of the central screw: green on top, blue below. */
function screwHalf(position: Vec3): Cubie {
  return {
    position,
    stickers: [
      { normal: UP, color: TOP },
      { normal: DOWN, color: BOTTOM },
    ],
  }
}

/** The solved star prism: 6 points per layer (outer layers first, so the
 *  outer star reads like a 2-star), then the 2 screw halves. */
export function solvedStar(shape: StarShape): Cube {
  const rings = [...STAR_RINGS[shape]].sort((a, b) => Math.abs(RING_Y[b]) - Math.abs(RING_Y[a]))
  return [
    ...rings.flatMap((ring) => SLOTS.map((_, k) => point(k, RING_Y[ring]))),
    screwHalf([1, 0, -1]),
    screwHalf([-1, 0, 1]),
  ]
}

/** One piece clockwise seen from above. */
const clockwise = ([q, y, r]: Vec3): Vec3 => [-r, y, q + r]
/** One piece counterclockwise seen from above. */
const counterclockwise = ([q, y, r]: Vec3): Vec3 => [q + r, y, -q]
/** The slash rotation: a half turn about the horizontal axis through the
 *  right half (toward slot 1), keeping it on its side, upside down. */
const slashTurn = ([q, y, r]: Vec3): Vec3 => [-r, -y, -q]

function times(map: (v: Vec3) => Vec3, n: number): (v: Vec3) => Vec3 {
  return (v) => {
    let out = v
    for (let i = 0; i < n; i++) out = map(out)
    return out
  }
}

/** Whether `move` turns the piece at `position`. */
export function starTurns(move: StarMove, position: Vec3): boolean {
  if ('slash' in move) return inRightHalf(position)
  return position[1] === RING_Y[move.ring]
}

/** Whether a ring turns clockwise seen from above (the top ones). */
const fromAbove = (ring: RingMove['ring']): boolean => RING_Y[ring] > 0

function mapOf(move: StarMove): (v: Vec3) => Vec3 {
  if ('slash' in move) return slashTurn
  // Clockwise seen from below is counterclockwise seen from above.
  return times(fromAbove(move.ring) ? clockwise : counterclockwise, move.amount)
}

/** The same map applied to every piece: the whole puzzle turned. */
const whole =
  (map: (v: Vec3) => Vec3) =>
  (cube: Cube): Cube =>
    cube.map((c) => ({
      position: map(c.position),
      stickers: c.stickers.map((st) => ({ normal: map(st.normal), color: st.color })),
    }))

/** The star prism's whole-puzzle symmetries: a sixth of a turn about its
 *  axis, and the slash's half turn applied to everything (upside down).
 *  Their closure, 12 orientations, gives the editor every way a piece can
 *  sit in a slot. */
export const STAR_SYMMETRIES: readonly ((cube: Cube) => Cube)[] = [
  whole(clockwise),
  whole(slashTurn),
]

export function applyStarMove(cube: Cube, move: StarMove): Cube {
  const map = mapOf(move)
  return cube.map((cubie) =>
    starTurns(move, cubie.position)
      ? {
          position: map(cubie.position),
          stickers: cubie.stickers.map((s) => ({ normal: map(s.normal), color: s.color })),
        }
      : cubie,
  )
}

/**
 * Where an axial position or normal [q, y, r] stands in the renderer's
 * cartesian frame (x right, y up, z front): x = q + r / 2, z = r * sqrt(3) / 2.
 */
export function starToCartesian([q, y, r]: Vec3): [number, number, number] {
  return [q + r / 2, y, (r * Math.sqrt(3)) / 2]
}

/** How a renderer animates a star turn: axis (cartesian, unit) and angle. */
export function starRotation(move: StarMove): {
  axis: [number, number, number]
  angle: number
} {
  if ('slash' in move) {
    // About the horizontal axis through the right half, toward slot 1.
    const [x, , z] = starToCartesian([SLOTS[1]![0], 0, SLOTS[1]![1]])
    const length = Math.hypot(x, z)
    return { axis: [x / length, 0, z / length], angle: Math.PI }
  }
  // Clockwise seen from above is a negative turn about +y; from below, positive.
  const pieces = move.amount > 3 ? move.amount - 6 : move.amount
  const sign = fromAbove(move.ring) ? -1 : 1
  return { axis: [0, 1, 0], angle: (sign * pieces * Math.PI) / 3 }
}

/** A Square-1 style scramble: turn every layer, slash, again and again. */
export function scrambleStar(shape: StarShape, length: number, rng: () => number): StarMove[] {
  const moves: StarMove[] = []
  const amount = () => (1 + Math.floor(rng() * 5)) as RingMove['amount']
  while (moves.length < length) {
    moves.push(...STAR_RINGS[shape].map((ring) => ({ ring, amount: amount() })), { slash: true })
  }
  return moves.slice(0, length)
}

export function invertStarMove(move: StarMove): StarMove {
  return 'slash' in move
    ? move
    : { ring: move.ring, amount: (6 - move.amount) as RingMove['amount'] }
}

/** Merge consecutive turns of the same layer, and cancel two slashes. */
export function simplifyStarMoves(moves: readonly StarMove[]): StarMove[] {
  const out: StarMove[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last && 'slash' in last && 'slash' in move) out.pop()
    else if (last && 'ring' in last && 'ring' in move && last.ring === move.ring) {
      out.pop()
      const total = (last.amount + move.amount) % 6
      if (total !== 0) out.push({ ring: move.ring, amount: total as RingMove['amount'] })
    } else out.push(move)
  }
  return out
}

/** The letter of each ring but the top one: the bottom label (`D`, `B` in
 *  French), and both in lowercase for the inner layers (`u` / `d`, `h` / `b`). */
function ringLetters(labels: FaceLabels): Record<Exclude<RingMove['ring'], 'U'>, string> {
  return { D: labels.D, u: labels.U.toLowerCase(), d: labels.D.toLowerCase() }
}

/**
 * Square-1 style notation, as fan2cube writes it: `3` turns the top 3 pieces
 * clockwise, `-2D` the bottom 2 pieces back (`-2B` in French notation, its
 * bottom label), `/` is the slash. A one-piece lettered turn drops the 1 (`D`,
 * `-D`), and turns are written the short way round (`-1` rather than `5`).
 * The inner layers of the 4-star take the lowercase letters: `2u`, `-d`.
 */
export function formatStarMove(move: StarMove, labels: FaceLabels): string {
  if ('slash' in move) return '/'
  const k = move.amount > 3 ? move.amount - 6 : move.amount
  if (move.ring === 'U') return String(k)
  return `${k === 1 ? '' : k === -1 ? '-' : k}${ringLetters(labels)[move.ring]}`
}

/** Parse fan2cube's notation, `/-1/1+B/-B/` style: slashes, `+` and spaces
 *  separate turns, parentheses only help reading. */
export function parseStarMoves(text: string, labels: FaceLabels): StarMove[] {
  const letters = Object.entries(ringLetters(labels)) as [RingMove['ring'], string][]
  const lettered = new RegExp(`^(-?\\d*)(${letters.map(([, l]) => l).join('|')})$`)
  const tokens = text
    .replace(/[()]/g, '')
    .replace(/\//g, ' / ')
    .split(/[+\s]+/)
    .filter(Boolean)
  const moves: StarMove[] = []
  for (const token of tokens) {
    if (token === '/') {
      moves.push({ slash: true })
      continue
    }
    const b = lettered.exec(token)
    const raw = b ? b[1]! : token
    if (!/^-?\d*$/.test(raw) || (!b && raw === '')) throw new Error(`Invalid star turn: "${token}"`)
    const n = raw === '' ? 1 : raw === '-' ? -1 : Number(raw)
    const amount = ((n % 6) + 6) % 6
    const ring = b ? letters.find(([, l]) => l === b[2])![0] : 'U'
    if (amount !== 0) moves.push({ ring, amount: amount as RingMove['amount'] })
  }
  return moves
}
