import { TET_NORMALS } from './geometry'
import type { FaceLabels } from './moves'
import type {
  Color,
  Cube,
  Cubie,
  Dims,
  PyraMove,
  PyraShape,
  PyraVertex,
  Sticker,
  Vec3,
} from './types'

/**
 * The Pyraminx and the Master Pyraminx (its 4x4 version): tetrahedra whose
 * four corners each turn by thirds of a turn.
 *
 * The Pyraminx (3 layers per corner): the whole layer under a corner (its
 * tip, its center piece and the three edges around it), or the tip alone.
 * Its 14 pieces: 4 tips and 4 center pieces (three center triangles each,
 * one per face around a corner) that only twist in place, 6 edges that
 * travel, plus the hidden core they turn around.
 *
 * The Master Pyraminx (4 layers per corner, fan2cube's G, G1, G2, G3) turns
 * one slice at a time: the tip, the first slice (its co-tip, fan2cube's
 * co-sommet, and three wings), the second (three wings, three midges, the
 * co-ailes, and three face centers) or the face opposite the corner. Its 30
 * pieces: 4 tips and 4 co-tips that only twist, 12 wings (never flipped:
 * twins told apart by their handedness, like a 4x4's), 6 midges and 4 face
 * centers that travel from face to face.
 *
 * Exact integer model, like the cubes: the corners point at alternate
 * corners of a cube (v below), so a third of a turn about any of them is a
 * signed permutation of the coordinates. Cut by the planes of its slices, a
 * tetrahedron of n layers is made of unit cells: small upright tetrahedra at
 * the sums of n - 1 corner vectors, octahedra at the sums of n - 2 (and,
 * hidden, upside-down tetrahedra). A cell is a piece when it touches the
 * surface, i.e. when some corner is missing from its sum: the Pyraminx's
 * tips at 2v, center pieces at v, edges at v + w (and the core at the
 * origin); the Master's tips at 3v, co-tips at 2v, wings at 2v + w, midges
 * at v + w, centers at u + v + w. Along a corner's axis the slices are 4
 * apart (the dot product with v), from 3n at the corner down to -n.
 */

/** The corners, in `TET_NORMALS` order (each face opposite one of them). */
export const PYRA_VERTICES: readonly PyraVertex[] = ['U', 'L', 'R', 'B']

/** Where each corner points (the Pyraminx's center pieces sit there). */
export const PYRA_CORNERS: Record<PyraVertex, Vec3> = {
  U: [1, 1, 1],
  L: [-1, -1, 1],
  R: [1, -1, -1],
  B: [-1, 1, -1],
}

/** Color of the face opposite each corner: yellow below, green in front,
 *  red on the right (opposite L), blue on the left (opposite R). */
const OPPOSITE_COLOR: Record<PyraVertex, Color> = { U: 'Y', L: 'R', R: 'B', B: 'G' }

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

/** One sticker per face the piece lies on: the faces opposite the corners it
 *  does not belong to. */
function piece(position: Vec3, own: readonly PyraVertex[]): Cubie {
  const stickers: Sticker[] = PYRA_VERTICES.flatMap((v, i) =>
    own.includes(v) ? [] : [{ normal: TET_NORMALS[i]!, color: OPPOSITE_COLOR[v] }],
  )
  return { position, stickers }
}

/** Layers per corner of a Pyraminx, from its mechanism's bounds (`SHAPE_DIMS`:
 *  coordinates within +-(n - 1), so 2n - 1 grid values per axis). */
export const pyraSize = (mechanism: Dims): number => (mechanism[0] + 1) / 2

/** Every way of adding `count` corner vectors (as how many of each), the
 *  ones with a corner missing: the cells that touch the surface. */
function surfaceSums(count: number): number[][] {
  const sums: number[][] = []
  for (let a = count; a >= 0; a--)
    for (let b = count - a; b >= 0; b--)
      for (let c = count - a - b; c >= 0; c--) sums.push([a, b, c, count - a - b - c])
  return sums.filter((n) => n.includes(0))
}

function cell(times: number[]): Cubie {
  const position = PYRA_VERTICES.reduce<Vec3>(
    (p, v, i) => add(p, PYRA_CORNERS[v].map((x) => x * times[i]!) as unknown as Vec3),
    [0, 0, 0],
  )
  return piece(
    position,
    PYRA_VERTICES.filter((_, i) => times[i]! > 0),
  )
}

/** The solved Pyraminx of `size` layers: tips, then center pieces (co-tips),
 *  then the other pieces (edges; wings, centers and midges), and the core
 *  of the Pyraminx. */
export function solvedPyraminx(size: number): Cube {
  const corner = (times: number) => (n: number[]) =>
    n.filter((x) => x > 0).length === 1 && n.includes(times)
  const upright = surfaceSums(size - 1)
  const octahedra = surfaceSums(size - 2)
  const isTip = corner(size - 1)
  const isCoTip = corner(size - 2)
  return [
    ...upright.filter(isTip),
    ...octahedra.filter(isCoTip),
    ...upright.filter((n) => !isTip(n)),
    ...octahedra.filter((n) => !isCoTip(n)),
  ]
    .map(cell)
    .concat(size === 3 ? [{ position: [0, 0, 0], stickers: [] }] : [])
}

/** The slices a turn takes, counted from its corner: the tip alone (0), one
 *  slice of the Master (1 to 3), or the Pyraminx's layer (0 and 1). */
function slicesOf(move: PyraMove): [number, number] {
  if (move.tip) return [0, 0]
  return move.slice ? [move.slice, move.slice] : [0, 1]
}

/** Whether `move` turns the piece at `position` on a Pyraminx of `size`
 *  layers: whether it lies between the planes bounding its slices. */
export function pyraTurns(move: PyraMove, position: Vec3, size: number): boolean {
  const [first, last] = slicesOf(move)
  const d = dot(position, PYRA_CORNERS[move.vertex])
  return d < 3 * size - 4 * first && d > 3 * size - 4 * (last + 1)
}

/**
 * A third of a turn about a corner, clockwise seen from it. About (1,1,1)
 * it is (x, y, z) -> (y, z, x); every other corner is (1,1,1) with signs
 * flipped by an even number of axes (a half turn of the whole puzzle), so
 * the same permutation conjugated by those signs.
 */
function clockwise(vertex: PyraVertex): (v: Vec3) => Vec3 {
  const s = PYRA_CORNERS[vertex]
  // `+ 0` turns a -0 (a sign flip of 0) into 0: states compare structurally.
  return ([x, y, z]) => [s[0] * s[1] * y + 0, s[1] * s[2] * z + 0, s[2] * s[0] * x + 0]
}

function mapOf(move: PyraMove): (v: Vec3) => Vec3 {
  const turn = clockwise(move.vertex)
  return move.amount === 1 ? turn : (v) => turn(turn(v))
}

const turnPiece = (map: (v: Vec3) => Vec3, cubie: Cubie): Cubie => ({
  position: map(cubie.position),
  stickers: cubie.stickers.map((s) => ({ normal: map(s.normal), color: s.color })),
})

export function applyPyraMove(cube: Cube, move: PyraMove, size: number): Cube {
  const map = mapOf(move)
  return cube.map((c) => (pyraTurns(move, c.position, size) ? turnPiece(map, c) : c))
}

/** The whole Pyraminx turned about its top, then about its left corner: their
 *  closure, 12 orientations, gives the editor every way a piece can sit. */
export const PYRA_SYMMETRIES: readonly ((cube: Cube) => Cube)[] = (['U', 'L'] as const).map(
  (vertex) => (cube: Cube) => cube.map((c) => turnPiece(clockwise(vertex), c)),
)

/** Layers per corner of each Pyraminx. */
export const PYRA_SIZE: Record<PyraShape, number> = { pyra: 3, pyra4: 4 }

/** What a turn takes under its corner: the Pyraminx's layer (`corners`), a
 *  tip, or one of the Master's slices. */
export type PyraLayer = 'corners' | 'tips' | 'slice1' | 'slice2' | 'slice3'

/** The layers each Pyraminx turns, in the pad's and the guide's order. */
export const PYRA_LAYERS: Record<PyraShape, readonly PyraLayer[]> = {
  pyra: ['corners', 'tips'],
  pyra4: ['tips', 'slice1', 'slice2', 'slice3'],
}

/** The turn of a corner's layer. */
export function pyraTurn(vertex: PyraVertex, layer: PyraLayer, amount: 1 | 2): PyraMove {
  if (layer === 'corners') return { vertex, amount }
  if (layer === 'tips') return { vertex, amount, tip: true }
  return { vertex, amount, slice: Number(layer.slice(5)) as 1 | 2 | 3 }
}

/** The layer a turn takes. */
export function pyraLayerOf(move: PyraMove): PyraLayer {
  if (move.tip) return 'tips'
  return move.slice ? (`slice${move.slice}` as PyraLayer) : 'corners'
}

const bothWays = (turn: Omit<PyraMove, 'amount'>): PyraMove[] =>
  ([1, 2] as const).map((amount) => ({ ...turn, amount }))

/** Every turn of a Pyraminx of `size` layers, both ways: each layer, then
 *  each tip; on the Master, each tip, then each slice, slice by slice. */
export function pyraTurnsOf(size: number): PyraMove[] {
  const tips = PYRA_VERTICES.flatMap((vertex) => bothWays({ vertex, tip: true }))
  if (size === 3) return [...PYRA_VERTICES.flatMap((vertex) => bothWays({ vertex })), ...tips]
  const slices = ([1, 2, 3] as const).flatMap((slice) =>
    PYRA_VERTICES.flatMap((vertex) => bothWays({ vertex, slice })),
  )
  return [...tips, ...slices]
}

/**
 * Where a position or normal stands in the renderer's frame (x right, y up,
 * z front): the U corner straight up, the front face (opposite B) toward the
 * viewer, tilted up as a Pyraminx standing on its bottom face is.
 */
export function pyraToCartesian([x, y, z]: Vec3): [number, number, number] {
  return [(x - z) / Math.SQRT2, (x + y + z) / Math.sqrt(3), (x - 2 * y + z) / Math.sqrt(6)]
}

/** How a renderer animates a Pyraminx turn: about the corner's axis, a third
 *  of a turn (clockwise seen from the corner: negative about it). */
export function pyraRotation(move: PyraMove): {
  axis: [number, number, number]
  angle: number
} {
  const [x, y, z] = pyraToCartesian(PYRA_CORNERS[move.vertex])
  const length = Math.hypot(x, y, z)
  return {
    axis: [x / length, y / length, z / length],
    angle: ((move.amount === 1 ? -2 : 2) * Math.PI) / 3,
  }
}

/** A scramble: layer turns (inner slices on the Master), never the same
 *  corner twice in a row, then each tip twisted at random, as the official
 *  scrambles end. */
export function scramblePyraminx(size: number, length: number, rng: () => number): PyraMove[] {
  const moves: PyraMove[] = []
  let last: PyraVertex | undefined
  while (moves.length < length) {
    const vertex = PYRA_VERTICES[Math.floor(rng() * 4)]!
    if (vertex === last) continue
    last = vertex
    const slice = size === 3 ? undefined : ((1 + Math.floor(rng() * 3)) as 1 | 2 | 3)
    moves.push({ vertex, amount: rng() < 0.5 ? 1 : 2, ...(slice && { slice }) })
  }
  for (const vertex of PYRA_VERTICES) {
    const amount = Math.floor(rng() * 3)
    if (amount > 0) moves.push({ vertex, amount: amount as 1 | 2, tip: true })
  }
  return moves
}

export function invertPyraMove(move: PyraMove): PyraMove {
  return { ...move, amount: move.amount === 1 ? 2 : 1 }
}

/** Whether two turns move the same pieces (whatever their amounts). */
export const samePyraLayer = (a: PyraMove, b: PyraMove): boolean =>
  a.vertex === b.vertex && !a.tip === !b.tip && a.slice === b.slice

/** Merge consecutive turns of the same layer (three thirds cancel out). */
export function simplifyPyraMoves(moves: readonly PyraMove[]): PyraMove[] {
  const out: PyraMove[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last && samePyraLayer(last, move)) {
      out.pop()
      const total = (last.amount + move.amount) % 3
      if (total !== 0) out.push({ ...move, amount: total as 1 | 2 })
    } else out.push(move)
  }
  return out
}

/** Letter of each corner: the international ones, or fan2cube's French
 *  Haut, Gauche, Droite, Postérieur (whose B, Bas, is a face here). */
const LETTERS: Record<'us' | 'fr', Record<PyraVertex, string>> = {
  us: { U: 'U', L: 'L', R: 'R', B: 'B' },
  fr: { U: 'H', L: 'G', R: 'D', B: 'P' },
}

/**
 * Each notation's own convention, as its users write it. International
 * (WCA): a layer is the uppercase letter (`R`), its tip alone the lowercase
 * one (`r`). French, as fan2cube.fr writes it: the tip (`sommet`) is the
 * uppercase letter (`D`), the layer (`tranche`) the lowercase one (`d`).
 * Either way `'` turns back (fan2cube's `²`, two thirds, is the same turn).
 *
 * A Master Pyraminx slice: in French fan2cube's numbered slices, `H'₁` (its
 * prime before the number, as the page writes it); in English the slice
 * number as a prefix, counting the tip as the first layer (`2U'`, SiGN
 * style). Its tips are written as the Pyraminx's.
 */
function notationOf(labels: FaceLabels): {
  letters: Record<PyraVertex, string>
  tipUpper: boolean
} {
  const fr = labels.U !== 'U'
  return { letters: LETTERS[fr ? 'fr' : 'us'], tipUpper: fr }
}

export function formatPyraMove(move: PyraMove, labels: FaceLabels): string {
  const { letters, tipUpper } = notationOf(labels)
  const letter = letters[move.vertex]
  const prime = move.amount === 2 ? "'" : ''
  if (move.slice) {
    return tipUpper
      ? `${letter}${prime}${SUBSCRIPTS[move.slice]}`
      : `${move.slice + 1}${letter}${prime}`
  }
  const upper = !!move.tip === tipUpper
  return (upper ? letter : letter.toLowerCase()) + prime
}

const SUBSCRIPTS = '₀₁₂₃'

/**
 * Parse fan2cube's formulas, `[gd'][h'd]` or `dhd'hdhd'` style: one letter
 * per turn, `'` or `²` (or `2`) to turn back, `[a b]` the commutator
 * a b a' b'. Spaces, dots and parentheses only help reading. On the Master
 * (`size` 4), the slices: `H'1` or `H'₁` (`H1'` too, and `h` for `H1`), or
 * `2U'` in English.
 */
export function parsePyraMoves(text: string, labels: FaceLabels, size = 3): PyraMove[] {
  const { letters, tipUpper } = notationOf(labels)
  const token =
    size === 3
      ? /([A-Za-z])(['²2]?)/y
      : tipUpper
        ? /([A-Za-z])(['²]?)([0-3₀-₃]?)(['²]?)/y
        : /([1-4]?)([A-Za-z])(['²]?)/y
  const moves: PyraMove[] = []
  let bracket: PyraMove[] | null = null
  let at = 0
  while (at < text.length) {
    const char = text[at]!
    if (/[\s.()]/.test(char)) {
      at++
      continue
    }
    if (char === '[') {
      if (bracket) break
      bracket = []
      at++
      continue
    }
    if (char === ']') {
      if (!bracket || bracket.length !== 2) throw new Error(`Invalid commutator in "${text}"`)
      const [a, b] = bracket as [PyraMove, PyraMove]
      moves.push(a, b, invertPyraMove(a), invertPyraMove(b))
      bracket = null
      at++
      continue
    }
    token.lastIndex = at
    const match = token.exec(text)
    const move = match && readMove(match, size, letters, tipUpper)
    if (!match || !move) throw new Error(`Invalid Pyraminx turn in "${text}" at ${at}`)
    ;(bracket ?? moves).push(move)
    at = token.lastIndex
  }
  if (bracket) throw new Error(`Invalid Pyraminx formula: "${text}"`)
  return moves
}

function readMove(
  match: RegExpExecArray,
  size: number,
  letters: Record<PyraVertex, string>,
  tipUpper: boolean,
): PyraMove | null {
  const english = size === 4 && !tipUpper
  const letter = (english ? match[2] : match[1])!
  const vertex = PYRA_VERTICES.find((v) => letters[v] === letter.toUpperCase())
  if (!vertex) return null
  const upper = letter === letter.toUpperCase()
  const amount = (english ? match[3] : match[2] || match[4]) ? 2 : 1
  if (size === 3) {
    const tip = upper === tipUpper
    return { vertex, amount, ...(tip && { tip: true }) }
  }
  // The Master: a number names the slice, the bare letter the tip (`H`,
  // `u`), fan2cube's lowercase letter its first slice.
  const digit = english ? match[1] : match[3]
  const slice = digit ? Math.max(0, SUBSCRIPTS.indexOf(digit), Number(digit) || 0) : 0
  const depth = english ? (digit ? slice - 1 : upper ? -1 : 0) : !upper ? (digit ? -1 : 1) : slice
  if (depth < 0 || depth > 3) return null
  return depth === 0 ? { vertex, amount, tip: true } : { vertex, amount, slice: depth as 1 | 2 | 3 }
}
