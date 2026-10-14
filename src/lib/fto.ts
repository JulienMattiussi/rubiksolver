import { OCT_FACE_COLOR } from './oct4'
import {
  FTO_LETTERS,
  FTO_SLICE_LETTERS,
  invertRainbowMove,
  RAINBOW_CORNERS,
  RAINBOW_TRIANGLES,
} from './rainbow'
import type { Cube, Cubie, RainbowCorner, RainbowMove, Vec3 } from './types'

/**
 * The FTO, Face Turning Octahedron (fan2cube.fr/FTO1, Jürgen Brandt, 2009):
 * an octahedron whose eight faces turn by thirds, as the VTO's corners turn
 * by quarters. Each face is cut into 9 triangles by the cuts of the faces
 * around it, a third of the way in: 6 corners (four triangles), 12 edges
 * (two), 24 centers (one, in two families that never mix), and a slice
 * between each face and its opposite.
 *
 * Integer model, the Rainbow's (rainbow.ts): the faces look along the
 * cube's diagonals, a third of a turn about one is a signed permutation of
 * the coordinates. The octahedron is |x| + |y| + |z| <= 6, cut at 2 along
 * each diagonal (a third of the way); a piece stands at a point of its
 * cell: corners at (3, 0, 0), edges at (2, 2, 0), centers at (2, 1, 1) on
 * the face (1, 1, 1) (near its corner (3, 0, 0)), and the like. A face
 * takes what is at least 2 along its diagonal, its slice what is within 2
 * of the middle (`rainbowTurns`). Its colors are the 4-Trajber's.
 */

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

const FACES: readonly Vec3[] = Object.values(RAINBOW_CORNERS)

const sticker = (normal: Vec3) => ({ normal, color: OCT_FACE_COLOR.get(normal.join())! })

/** Every signed permutation of a point's coordinates, once each. */
function images(point: Vec3): Vec3[] {
  const seen = new Map<string, Vec3>()
  const orders = [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
    [0, 2, 1],
    [2, 1, 0],
    [1, 0, 2],
  ]
  for (const order of orders) {
    for (const signs of FACES) {
      const p = order.map((d, i) => point[d]! * signs[i]! + 0) as unknown as Vec3
      seen.set(p.join(), p)
    }
  }
  return [...seen.values()]
}

/** The solved FTO: its corners, edges and centers, each showing the faces
 *  it lies on. */
export function solvedFto(): Cube {
  const piece = (position: Vec3, onFace: (n: Vec3) => boolean): Cubie => ({
    position,
    stickers: FACES.filter(onFace).map(sticker),
  })
  const corners = images([3, 0, 0]).map((p) =>
    piece(p, (n) => p.every((v, d) => v === 0 || n[d] === Math.sign(v))),
  )
  const edges = images([2, 2, 0]).map((p) =>
    piece(p, (n) => p.every((v, d) => v === 0 || n[d] === Math.sign(v))),
  )
  // A center is on the face whose signs it has: the one it is deepest along.
  const centers = images([2, 1, 1]).map((p) => piece(p, (n) => dot(n, p) === 4))
  return [...corners, ...edges, ...centers]
}

/** The faces that have a slice named after them, one per axis. */
const SLICED = Object.keys(FTO_SLICE_LETTERS.fr) as RainbowCorner[]

/** A slice as named: one named after its opposite face is the same slice,
 *  the other way round (`fromEverySide` makes such). */
export function namedSlice(move: RainbowMove): RainbowMove {
  if (!move.slice || SLICED.includes(move.triangle)) return move
  const d = RAINBOW_CORNERS[move.triangle]
  const triangle = RAINBOW_TRIANGLES.find(
    (t) => RAINBOW_CORNERS[t].join() === d.map((v) => -v).join(),
  )!
  return { ...move, triangle, amount: move.amount === 1 ? 2 : 1 }
}

/** Every FTO turn, both ways: the eight faces, then the four slices. */
export const FTO_TURNS: readonly RainbowMove[] = [
  ...RAINBOW_TRIANGLES.map((triangle) => ({ triangle, fto: true as const })),
  ...SLICED.map((triangle) => ({ triangle, fto: true as const, slice: true as const })),
].flatMap((turn) => ([1, 2] as const).map((amount): RainbowMove => ({ ...turn, amount })))

/** An FTO scramble: faces (and a slice now and then) at random, never the
 *  same layer twice in a row. */
export function scrambleFto(length: number, rng: () => number): RainbowMove[] {
  const moves: RainbowMove[] = []
  while (moves.length < length) {
    const move = FTO_TURNS[Math.floor(rng() * FTO_TURNS.length)]!
    const last = moves[moves.length - 1]
    if (last && last.triangle === move.triangle && !last.slice === !move.slice) continue
    moves.push(move)
  }
  return moves
}

/** Read fan2cube's FTO formulas (`[D A']`, `dHd'h`, `(DHD'H)²`): a capital
 *  a face (underlined: the opposite one), a small letter a slice, `'` back,
 *  `²` twice, `[a b]` the commutator a b a' b', `(...)²` a group twice. */
export function parseFtoMoves(text: string): RainbowMove[] {
  const faces = Object.entries(FTO_LETTERS.fr) as [RainbowCorner, string][]
  const slices = Object.entries(FTO_SLICE_LETTERS.fr) as [RainbowCorner, string][]
  const stack: RainbowMove[][] = [[]]
  let commutator = false
  for (const m of text.matchAll(/(\[)|(\])|(\()|(\))(²)?|([HBAPGDhagd]̲?)(')?(²)?/g)) {
    const top = stack[stack.length - 1]!
    if (m[1]) {
      stack.push([])
      commutator = true
    } else if (m[2] || m[4]) {
      const group = stack.pop()!
      const into = stack[stack.length - 1]!
      if (m[2] && commutator) {
        into.push(...group, ...group.map(invertRainbowMove))
        commutator = false
      } else into.push(...group, ...(m[5] ? group : []))
    } else if (m[3]) stack.push([])
    else {
      const letter = m[6]!
      const slice = letter === letter.toLowerCase()
      const triangle = (slice ? slices : faces).find(([, l]) => l === letter)![0]
      const turn: RainbowMove = {
        triangle,
        amount: m[7] ? 2 : 1,
        fto: true,
        ...(slice && { slice: true as const }),
      }
      top.push(...(m[8] ? [turn, turn] : [turn]))
    }
  }
  return stack[0]!
}
