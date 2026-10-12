import { TET_NORMALS } from './geometry'
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
 *
 * The Pyraminx Jing (fan2cube.fr/pyraminxjing1) cuts deeper: each corner
 * turns its half of the puzzle, the cut passing beyond the center (a Skewb's
 * core). Its 14 pieces: 4 corners that only twist, 6 edges and 4 face
 * centers, each turn taking a corner, its three edges and the three centers
 * around it. A piece is the set of halves it belongs to, placed at the sum
 * of their corners: a corner at v, an edge at (v + w) / 2 (a unit axis), a
 * center at u + v + w (that is, minus the corner it lacks), so a turn takes
 * every piece on the corner's side of the origin, like the Pyraminx's layer.
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
export const PYRA_FACE_COLOR: Record<PyraVertex, Color> = { U: 'Y', L: 'R', R: 'B', B: 'G' }

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

/** One sticker per face the piece lies on: the faces opposite the corners it
 *  does not belong to. */
function piece(position: Vec3, own: readonly PyraVertex[]): Cubie {
  const stickers: Sticker[] = PYRA_VERTICES.flatMap((v, i) =>
    own.includes(v) ? [] : [{ normal: TET_NORMALS[i]!, color: PYRA_FACE_COLOR[v] }],
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
function solvedPyraminx(size: number): Cube {
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

/** The solved Pyraminx Jing: corners, edges, centers, and its (Skewb) core. */
function solvedJing(): Cube {
  const edges: Cubie[] = []
  PYRA_VERTICES.forEach((a, i) =>
    PYRA_VERTICES.slice(i + 1).forEach((b) => {
      const [x, y, z] = add(PYRA_CORNERS[a], PYRA_CORNERS[b])
      edges.push(piece([x / 2, y / 2, z / 2], [a, b]))
    }),
  )
  return [
    ...PYRA_VERTICES.map((v) => piece(PYRA_CORNERS[v], [v])),
    ...edges,
    ...PYRA_VERTICES.map((v) =>
      piece(
        PYRA_CORNERS[v].map((x) => -x) as unknown as Vec3,
        PYRA_VERTICES.filter((w) => w !== v),
      ),
    ),
    { position: [0, 0, 0], stickers: [] },
  ]
}

/** A solved Pyraminx of any kind. */
export function solvedPyra(shape: PyraShape): Cube {
  return shape === 'jing' ? solvedJing() : solvedPyraminx(PYRA_SIZE[shape])
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
  const d = dot(position, PYRA_CORNERS[move.vertex])
  // The Jing's half: the corner's side of the origin.
  if (move.deep) return d > 0
  const [first, last] = slicesOf(move)
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

/** Layers per corner of each Pyraminx (the Jing counts 2: its pieces sit
 *  within +-1, and its deep turns need no slice planes). */
const PYRA_SIZE: Record<PyraShape, number> = { pyra: 3, pyra4: 4, pyra5: 5, jing: 2 }

/** What a turn takes under its corner: the Pyraminx's layer (`corners`), a
 *  tip, one of the Master's or the Professor's slices (the last one is the
 *  face opposite the corner), or the Jing's half (`deep`). */
export type PyraLayer = 'corners' | 'tips' | 'slice1' | 'slice2' | 'slice3' | 'slice4' | 'deep'

/** The layers each Pyraminx turns, in the pad's and the guide's order. */
export const PYRA_LAYERS: Record<PyraShape, readonly PyraLayer[]> = {
  pyra: ['corners', 'tips'],
  pyra4: ['tips', 'slice1', 'slice2', 'slice3'],
  pyra5: ['tips', 'slice1', 'slice2', 'slice3', 'slice4'],
  jing: ['deep'],
}

/** Whether a layer is the face opposite the corner: the last slice of the
 *  Master's (its third) or the Professor's (its fourth). */
export const isOppositeFace = (shape: PyraShape, layer: PyraLayer): boolean =>
  layer.startsWith('slice') && PYRA_LAYERS[shape].at(-1) === layer

/** The turn of a corner's layer. */
export function pyraTurn(vertex: PyraVertex, layer: PyraLayer, amount: 1 | 2): PyraMove {
  if (layer === 'corners') return { vertex, amount }
  if (layer === 'tips') return { vertex, amount, tip: true }
  if (layer === 'deep') return { vertex, amount, deep: true }
  return { vertex, amount, slice: Number(layer.slice(5)) as 1 | 2 | 3 | 4 }
}

/** The layer a turn takes. */
export function pyraLayerOf(move: PyraMove): PyraLayer {
  if (move.tip) return 'tips'
  if (move.deep) return 'deep'
  return move.slice ? (`slice${move.slice}` as PyraLayer) : 'corners'
}

/** Every turn of a Pyraminx, both ways, layer by layer (`PYRA_LAYERS`). */
export function pyraTurnsOf(shape: PyraShape): PyraMove[] {
  return PYRA_LAYERS[shape].flatMap((layer) =>
    PYRA_VERTICES.flatMap((vertex) =>
      ([1, 2] as const).map((amount) => pyraTurn(vertex, layer, amount)),
    ),
  )
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

/** A scramble: turns of the shape's layers but its tips (the Master's
 *  slices, the Jing's halves), never the same corner twice in a row, then
 *  each tip twisted at random, as the official scrambles end. */
export function scramblePyraminx(shape: PyraShape, length: number, rng: () => number): PyraMove[] {
  const layers = PYRA_LAYERS[shape].filter((l) => l !== 'tips')
  const moves: PyraMove[] = []
  let last: PyraVertex | undefined
  while (moves.length < length) {
    const vertex = PYRA_VERTICES[Math.floor(rng() * 4)]!
    if (vertex === last) continue
    last = vertex
    const layer = layers[Math.floor(rng() * layers.length)]!
    moves.push(pyraTurn(vertex, layer, rng() < 0.5 ? 1 : 2))
  }
  if (!PYRA_LAYERS[shape].includes('tips')) return moves
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
  a.vertex === b.vertex && pyraLayerOf(a) === pyraLayerOf(b)

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
