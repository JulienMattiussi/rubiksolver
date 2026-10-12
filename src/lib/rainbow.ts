import { FACE_NORMAL } from './geometry'
import type { FaceLabels } from './moves'
import type { Color, Cube, Cubie, Face, RainbowCorner, RainbowMove, Vec3 } from './types'

/**
 * The Rainbow (fan2cube.fr/rainbow1, Bethel Japan, 1971): a
 * cuboctahedron, 6 squares and 8 triangles. Each triangle turns by thirds
 * of a turn, its center fixed, taking the three pieces at its corners: a
 * 3-cycle of them. Its 12 pieces sit at the cuboctahedron's 12 corners,
 * each showing four colors (a quarter of two squares, a corner of two
 * triangles), never turned in place: 12!/2 states.
 *
 * Integer model: the squares face the cube's axes, the triangles its
 * diagonals; the pieces sit at the cube's edge middles ((1, 1, 0) and the
 * like), the fixed centers at its corners ((1, 1, 1)...). A third of a turn
 * about a diagonal is a signed permutation of the coordinates. The puzzle
 * is held a square in front, turned an eighth about it so that its
 * triangles sit above, below and on its sides (the drawing's frame): the
 * one above it is (1, 1, 1).
 */

/** Where each triangle faces, in the model. */
export const RAINBOW_CORNERS: Record<RainbowCorner, Vec3> = {
  U: [1, 1, 1],
  D: [-1, -1, 1],
  L: [-1, 1, 1],
  R: [1, -1, 1],
  u: [1, 1, -1],
  d: [-1, -1, -1],
  l: [-1, 1, -1],
  r: [1, -1, -1],
}

export const RAINBOW_TRIANGLES = Object.keys(RAINBOW_CORNERS) as RainbowCorner[]

/** Colors: the squares the cube's, each triangle its own (the top one
 *  violet, as on fan2cube). The triangles in front all touch the green
 *  square, those behind the blue one: dark blue sits in front, dark green
 *  behind. */
const SQUARE_COLOR: Record<Face, Color> = { U: 'W', D: 'Y', F: 'G', B: 'B', R: 'R', L: 'O' }
const TRIANGLE_COLOR: ReadonlyMap<string, Color> = new Map<string, Color>([
  ['1,1,1', 'V'],
  ['-1,1,1', 'N'],
  ['1,-1,1', 'T'],
  ['-1,-1,1', 'K'],
  ['1,1,-1', 'L'],
  ['-1,1,-1', 'E'],
  ['1,-1,-1', 'M'],
  ['-1,-1,-1', 'P'],
])
const triangleColor = (d: Vec3): Color => TRIANGLE_COLOR.get(d.join())!

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** The solved Rainbow: the 12 pieces, then the 8 fixed centers. */
export function solvedRainbow(): Cube {
  const pieces: Cubie[] = []
  for (let zero = 0; zero < 3; zero++) {
    for (const a of [1, -1]) {
      for (const b of [1, -1]) {
        const others = [0, 1, 2].filter((d) => d !== zero)
        const position = [0, 0, 0] as [number, number, number]
        position[others[0]!] = a
        position[others[1]!] = b
        const squares = (Object.keys(FACE_NORMAL) as Face[])
          .filter((f) => dot(FACE_NORMAL[f], position) > 0)
          .map((f) => ({ normal: FACE_NORMAL[f], color: SQUARE_COLOR[f] }))
        const triangles = Object.values(RAINBOW_CORNERS)
          .filter((d) => dot(d, position) === 2)
          .map((d) => ({ normal: d, color: triangleColor(d) }))
        pieces.push({ position, stickers: [...squares, ...triangles] })
      }
    }
  }
  const centers = Object.values(RAINBOW_CORNERS).map((d): Cubie => ({
    position: d,
    stickers: [{ normal: d, color: triangleColor(d) }],
  }))
  return [...pieces, ...centers]
}

/** Whether a triangle's turn takes a piece: its three corners (and its
 *  fixed center, which only spins). */
export const rainbowTurns = (move: RainbowMove, position: Vec3): boolean =>
  dot(position, RAINBOW_CORNERS[move.triangle]) >= 2

/** A third of a turn about a diagonal, clockwise seen from it. About
 *  (1, 1, 1) it is (x, y, z) -> (y, z, x); about another diagonal the same
 *  conjugated by its signs, the other way round when they flip an odd
 *  number of axes (a mirror). */
function clockwise(d: Vec3): (v: Vec3) => Vec3 {
  const [a, b, c] = d
  const turn = ([x, y, z]: Vec3): Vec3 => (a * b * c > 0 ? [y, z, x] : [z, x, y])
  return (v) => {
    const t = turn([a * v[0], b * v[1], c * v[2]])
    return [a * t[0] + 0, b * t[1] + 0, c * t[2] + 0]
  }
}

export function applyRainbowMove(cube: Cube, move: RainbowMove): Cube {
  const once = clockwise(RAINBOW_CORNERS[move.triangle])
  const map = move.amount === 1 ? once : (v: Vec3) => once(once(v))
  return cube.map((c) =>
    rainbowTurns(move, c.position)
      ? {
          position: map(c.position),
          stickers: c.stickers.map((s) => ({ normal: map(s.normal), color: s.color })),
        }
      : c,
  )
}

/** The axis a triangle turns about, in the model, and the angle (clockwise
 *  seen from it: negative about it). */
export function rainbowRotation(move: RainbowMove) {
  const d = RAINBOW_CORNERS[move.triangle]
  const length = Math.sqrt(3)
  return {
    axis: d.map((v) => v / length) as [number, number, number],
    angle: ((move.amount === 1 ? -2 : 2) * Math.PI) / 3,
  }
}

/** Every turn, both ways. */
export const RAINBOW_TURNS: readonly RainbowMove[] = RAINBOW_TRIANGLES.flatMap((triangle) =>
  ([1, 2] as const).map((amount) => ({ triangle, amount })),
)

export const invertRainbowMove = (move: RainbowMove): RainbowMove => ({
  ...move,
  amount: move.amount === 1 ? 2 : 1,
})

/** Merge turns of one triangle in a row (three thirds cancel out). */
export function simplifyRainbowMoves(moves: readonly RainbowMove[]): RainbowMove[] {
  const out: RainbowMove[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last?.triangle === move.triangle) {
      out.pop()
      const total = (last.amount + move.amount) % 3
      if (total !== 0) out.push({ ...move, amount: total as 1 | 2 })
    } else out.push(move)
  }
  return out
}

/** A scramble: triangles at random, never the same twice in a row. */
export function scrambleRainbow(length: number, rng: () => number): RainbowMove[] {
  const moves: RainbowMove[] = []
  while (moves.length < length) {
    const triangle = RAINBOW_TRIANGLES[Math.floor(rng() * RAINBOW_TRIANGLES.length)]!
    if (triangle === moves[moves.length - 1]?.triangle) continue
    moves.push({ triangle, amount: rng() < 0.5 ? 1 : 2 })
  }
  return moves
}

/** Each triangle's letter: fan2cube's Haut, Bas, Gauche, Droite in
 *  French, U D L R in English; a triangle behind, in lowercase. */
const LETTERS: Record<'us' | 'fr', Record<RainbowCorner, string>> = {
  us: { U: 'U', D: 'D', L: 'L', R: 'R', u: 'u', d: 'd', l: 'l', r: 'r' },
  fr: { U: 'H', D: 'B', L: 'G', R: 'D', u: 'h', d: 'b', l: 'g', r: 'd' },
}

export function formatRainbowMove(move: RainbowMove, labels: FaceLabels): string {
  const letter = LETTERS[labels.U === 'U' ? 'us' : 'fr'][move.triangle]
  return letter + (move.amount === 2 ? "'" : '')
}

/** Read fan2cube's formulas (`[H' G']`, `HDH'D'`): a letter a triangle,
 *  `'` back, `[a b]` the commutator a b a' b'. */
export function parseRainbowMoves(text: string): RainbowMove[] {
  const out: RainbowMove[] = []
  let group: RainbowMove[] | null = null
  for (const m of text.matchAll(/(\[)|(\])|([HBGDhbgd])(')?/g)) {
    if (m[1]) group = []
    else if (m[2]) {
      out.push(...group!, ...group!.map(invertRainbowMove))
      group = null
    } else {
      const triangle = RAINBOW_TRIANGLES.find((t) => LETTERS.fr[t] === m[3])!
      ;(group ?? out).push({ triangle, amount: m[4] ? 2 : 1 })
    }
  }
  return out
}
