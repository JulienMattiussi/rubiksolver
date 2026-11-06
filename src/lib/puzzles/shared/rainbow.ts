import { dot, FACE_NORMAL, mapPiece } from '../../core/geometry'
import type { CornerTakes } from '../../core/guide'
import type { FaceLabels } from '../../core/notation'
import type {
  Color,
  Cube,
  Cubie,
  Face,
  RainbowCorner,
  RainbowCut,
  RainbowMove,
  Vec3,
} from '../../core/types'

/**
 * The model of the puzzles whose corners (or a cube's diagonals) turn by
 * thirds, shared by several categories: the Rainbow's, below, and on it the
 * Dino Cube and the Rex Cube (dinoRex.ts), the Skewbs (skewbs.ts) and the
 * FTO (fto.ts), each with its own pieces and its own cuts (how deep a
 * turn goes along its diagonal); their notations are all here.
 *
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
export const SQUARE_COLOR: Record<Face, Color> = { U: 'W', D: 'Y', F: 'G', B: 'B', R: 'R', L: 'O' }

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

/** The Rainbow's cut: a triangle's turn takes its three corners (and its
 *  fixed center, which only spins). */
export const RAINBOW_CUT: RainbowCut = { from: 2 }

/** Whether a cut is a slice's, between two cuts. */
export const isSliceCut = (cut: RainbowCut): boolean => cut.to !== undefined

/** Whether two turns cut the same layer of their diagonal. */
export const sameCut = (a: RainbowCut, b: RainbowCut): boolean => a.from === b.from && a.to === b.to

/** Whether a turn takes a piece: what lies within its cut along its
 *  diagonal (each puzzle's cut: `RAINBOW_CUT`, `REX_CUT`, `FTO_SLICE`...). */
export const rainbowTurns = (move: RainbowMove, position: Vec3): boolean => {
  const along = dot(position, RAINBOW_CORNERS[move.triangle])
  return along >= move.cut.from && (move.cut.to === undefined || along <= move.cut.to)
}

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
  return cube.map((c) => (rainbowTurns(move, c.position) ? mapPiece(map)(c) : c))
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
export const RAINBOW_TURNS: readonly RainbowMove[] = turnsOf(RAINBOW_CUT)

/** Every triangle's turn of a cut, both ways. */
export function turnsOf(cut: RainbowCut): RainbowMove[] {
  return RAINBOW_TRIANGLES.flatMap((triangle) =>
    ([1, 2] as const).map((amount) => ({ triangle, amount, cut })),
  )
}

export const invertRainbowMove = (move: RainbowMove): RainbowMove => ({
  ...move,
  amount: move.amount === 1 ? 2 : 1,
})

/** Merge turns of one triangle in a row (three thirds cancel out). */
export function simplifyRainbowMoves(moves: readonly RainbowMove[]): RainbowMove[] {
  const out: RainbowMove[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last?.triangle === move.triangle && sameCut(last.cut, move.cut)) {
      out.pop()
      const total = (last.amount + move.amount) % 3
      if (total !== 0) out.push({ ...move, amount: total as 1 | 2 })
    } else out.push(move)
  }
  return out
}

/** A scramble: triangles at random, never the same twice in a row (turns
 *  of this cut: the Dino Cube's, the Rex Cube's...). */
export function scrambleRainbow(
  length: number,
  rng: () => number,
  cut: RainbowCut = RAINBOW_CUT,
): RainbowMove[] {
  const moves: RainbowMove[] = []
  while (moves.length < length) {
    const triangle = RAINBOW_TRIANGLES[Math.floor(rng() * RAINBOW_TRIANGLES.length)]!
    if (triangle === moves[moves.length - 1]?.triangle) continue
    moves.push({ triangle, amount: rng() < 0.5 ? 1 : 2, cut })
  }
  return moves
}

/** Each triangle's letter: fan2cube's Haut, Bas, Gauche, Droite in
 *  French, U D L R in English; a triangle behind, in lowercase. */
const LETTERS: Record<'us' | 'fr', Record<RainbowCorner, string>> = {
  us: { U: 'U', D: 'D', L: 'L', R: 'R', u: 'u', d: 'd', l: 'l', r: 'r' },
  fr: { U: 'H', D: 'B', L: 'G', R: 'D', u: 'h', d: 'b', l: 'g', r: 'd' },
}

/** How a puzzle of the family names its turns (its model's `rainbow`):
 *  by triangle (the Rainbow's, and a turn named without its puzzle), by
 *  face (the FTO's), or by corner (the Dino Cube's and those cut from it),
 *  saying then what a corner's turn takes along, for the move guide. */
export type RainbowNaming =
  { readonly by: 'triangle' | 'face' } | { readonly by: 'corner'; readonly takes: CornerTakes }

/** Marks a slice named by triangle: never shown, only a turn told without
 *  its puzzle (a key) keeps it apart from its corner's. */
const SLICE_MARK = '*'

export function formatRainbowMove(
  move: RainbowMove,
  labels: FaceLabels,
  naming?: RainbowNaming,
): string {
  const notation = labels.U === 'U' ? 'us' : 'fr'
  const slice = isSliceCut(move.cut)
  const by = naming?.by ?? 'triangle'
  const letter =
    by === 'face'
      ? (slice ? FTO_SLICE_LETTERS : FTO_LETTERS)[notation][move.triangle]!
      : by === 'corner'
        ? (slice ? MASTER_SLICE_LETTERS : DINO_LETTERS)[notation][move.triangle]!
        : LETTERS[notation][move.triangle] + (slice ? SLICE_MARK : '')
  return letter + (move.amount === 2 ? "'" : '')
}

/** The underline that marks a face opposite another (fan2cube's FTO). */
const UNDER = '\u0332'

/**
 * The FTO's faces, as fan2cube names them (FTO1): H(aut) on top, A(vant)
 * in front, G(auche) and D(roite) beside it, P(ostérieur) and B(as) below,
 * and the faces opposite G and D, underlined; in English, the WCA's (U, F,
 * L, R; D, B, BR opposite L, BL opposite R).
 */
export const FTO_LETTERS: Record<'us' | 'fr', Record<RainbowCorner, string>> = {
  us: { U: 'U', u: 'F', r: 'L', l: 'R', d: 'D', D: 'B', L: 'BR', R: 'BL' },
  fr: { U: 'H', u: 'A', r: 'G', l: 'D', d: 'B', D: 'P', L: `G${UNDER}`, R: `D${UNDER}` },
}

/** Its slices, one per axis, named by the face they turn with. */
export const FTO_SLICE_LETTERS: Record<'us' | 'fr', Partial<Record<RainbowCorner, string>>> = {
  us: { U: 'u', u: 'f', r: 'l', l: 'r' },
  fr: { U: 'h', u: 'a', r: 'g', l: 'd' },
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
      ;(group ?? out).push({ triangle, amount: m[4] ? 2 : 1, cut: RAINBOW_CUT })
    }
  }
  return out
}

/** Each corner's letter, as fan2cube names them (dinocube2): A (HDA), D
 *  (HPD), P (HGP), G (HAG) on top, B (BAD), E (BDP), H (BPG), O (BGA)
 *  below; in English, its three faces. */
const DINO_LETTERS: Record<'us' | 'fr', Record<RainbowCorner, string>> = {
  us: { U: 'UFR', u: 'UBR', l: 'UBL', L: 'UFL', R: 'DFR', r: 'DBR', d: 'DBL', D: 'DFL' },
  fr: { U: 'A', u: 'D', l: 'P', L: 'G', R: 'B', r: 'E', d: 'H', D: 'O' },
}

/** The cuts a puzzle named by corner turns its formulas with: its
 *  corners', and its inner slices' (the Master Skewb's). */
export interface CornerCuts {
  readonly corner: RainbowCut
  readonly slice?: RainbowCut
}

/** Read fan2cube's Dino formulas (`[GA']`, `DAD'.GAE'`) as the turns of a
 *  puzzle's cuts: a letter a corner, a lowercase letter an inner slice,
 *  `'` back, `²` twice, `[a b]` the commutator a b a' b'. */
export function parseDinoMoves(text: string, cuts: CornerCuts): RainbowMove[] {
  const out: RainbowMove[] = []
  let group: RainbowMove[] | null = null
  for (const m of text.matchAll(/(\[)|(\])|([ADPGBEHObeho])(')?(²)?/g)) {
    if (m[1]) group = []
    else if (m[2]) {
      // The commutator's second half: its turns undone, in the same order.
      out.push(...group!, ...group!.map(invertRainbowMove))
      group = null
    } else {
      const slice = m[3] === m[3]!.toLowerCase()
      const triangle = RAINBOW_TRIANGLES.find((t) => DINO_LETTERS.fr[t] === m[3]!.toUpperCase())!
      const turn: RainbowMove = {
        triangle,
        amount: m[4] ? 2 : 1,
        cut: slice ? cuts.slice! : cuts.corner,
      }
      ;(group ?? out).push(...(m[5] ? [turn, turn] : [turn]))
    }
  }
  return out
}

/** The Master Skewb's inner slices, one per diagonal, named (fan2cube's o
 *  and e) by the bottom corner at its end. */
export const MASTER_SLICES: readonly RainbowCorner[] = RAINBOW_TRIANGLES.filter(
  (t) => RAINBOW_CORNERS[t][1] < 0,
)

/** Its slices' letters: their bottom corner's, in lowercase. */
const MASTER_SLICE_LETTERS: Record<'us' | 'fr', Partial<Record<RainbowCorner, string>>> = {
  us: Object.fromEntries(MASTER_SLICES.map((t) => [t, DINO_LETTERS.us[t].toLowerCase()])),
  fr: Object.fromEntries(MASTER_SLICES.map((t) => [t, DINO_LETTERS.fr[t].toLowerCase()])),
}
