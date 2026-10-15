import { faceColorsOf } from '../../core/cube'
import { FACE_SPEC, mapVec } from '../../core/geometry'
import { applyMove } from '../../core/turn'
import { BLOCK_TURNS } from '../../puzzles/twisted/fashion'
import type { Cube, CubeShape, Move, Vec3 } from '../../core/types'
import { once } from '../../solve/once'

/**
 * The Fashion-V's shape (lib/puzzles/twisted/fashion.ts), for the search
 * that lays it back in its box, the page's "passer en 3x3x5". Seen as a
 * 3x3x3 of cells (its blocks turn them as a 3x3x3's faces), each cell of an edge or a corner holds either two halves cut
 * across one axis (a pair: a top piece and the one under it, or any two
 * once mixed) or one whole piece (an equator edge). In the box every pair
 * lies (cut across the vertical: a corner's top color is then up, its turn
 * and its cut are one) and the equator holds its four edges, each the way
 * round the middle centers say: its red or orange sticker on the right or
 * the left with them where they are, on the front or the back with them a
 * quarter round (only its own turn, 3U, moves them, which this search does
 * not use, and it turns all four with them).
 *
 * The blocks change the shape, the layers alone (which only go when whole)
 * do not, so the search turns blocks only. Three parts change apart: the
 * pairs' cuts on the edges (126 720 shapes), the whole edges' places and
 * ways round (7 920) and the corners' cuts (6 561); each has its table of
 * distances from the box, and an IDA* search bounded by the three finds
 * the way back, as Kociemba's first phase does.
 */

const MECHANISM = [5, 5, 5] as const

/** The cell of a coordinate: the outer two layers are one cell. */
const cellOf = (v: number) => Math.sign(v)

const CELLS: Vec3[] = []
for (const x of [-1, 0, 1]) {
  for (const y of [-1, 0, 1]) {
    for (const z of [-1, 0, 1]) {
      if ([x, y, z].filter((v) => v === 0).length < 2) CELLS.push([x, y, z])
    }
  }
}
const EDGES = CELLS.filter((c) => c.includes(0))
const CORNERS = CELLS.filter((c) => !c.includes(0))
const indexIn = (list: Vec3[]) => new Map(list.map((c, i) => [c.join(), i]))
const EDGE_INDEX = indexIn(EDGES)
const CORNER_INDEX = indexIn(CORNERS)

/** Per cell: the axis its halves are cut across (0, 1, 2), or for a whole
 *  piece 3 + the axis its red or orange sticker faces (`WHOLE` when only
 *  that it is whole matters). */
type Shape = number[]

/** A whole edge, its way round left aside. */
export const WHOLE = 9

/** The edges' and corners' shapes of a puzzle. */
function shapesOf(cube: Cube, shape: CubeShape): { edges: Shape; corners: Shape } {
  const colors = faceColorsOf(shape)
  const sideways = new Set([colors.R, colors.L])
  const edges = EDGES.map(() => 3)
  const corners = CORNERS.map(() => 3)
  for (const c of cube) {
    const cell = mapVec(c.position, cellOf)
    const cut = c.position.findIndex((v) => Math.abs(v) === 2)
    const e = EDGE_INDEX.get(cell.join())
    if (e !== undefined && cut >= 0) edges[e] = cut
    else if (e !== undefined && edges[e] === 3 && c.stickers.length === 2) {
      // A whole edge (its cell has no cut): the way its red or orange faces.
      const side = c.stickers.find((s) => sideways.has(s.color))
      if (side) edges[e] = 3 + side.normal.findIndex((v) => v !== 0)
    }
    const k = CORNER_INDEX.get(cell.join())
    if (k !== undefined && cut >= 0) corners[k] = cut
  }
  return { edges, corners }
}

/** A turn on shapes: where it sends each cell (by index), and each axis. */
interface ShapeTurn {
  readonly edges: number[]
  readonly corners: number[]
  readonly axes: number[]
  readonly inside: (cell: Vec3) => boolean
}

const turnOf = (move: Move): ShapeTurn => {
  const axis = FACE_SPEC[move.face].coordIndex
  const side = FACE_SPEC[move.face].dir
  const inside = (cell: Vec3) => cell[axis] === side
  const sent = (list: Vec3[], index: Map<string, number>) =>
    list.map((cell) => {
      if (!inside(cell)) return index.get(cell.join())!
      const [moved] = applyMove([{ position: cell, stickers: [] }], move, MECHANISM)
      return index.get(moved!.position.join())!
    })
  const axes = [0, 1, 2].map((a) => {
    const normal = mapVec([0, 1, 2], (d) => (d === a ? 1 : 0))
    const cell = mapVec([0, 0, 0], (_, d) => (d === axis ? side : 0))
    const [moved] = applyMove(
      [{ position: cell, stickers: [{ normal, color: 'W' }] }],
      move,
      MECHANISM,
    )
    return moved!.stickers[0]!.normal.findIndex((v) => v !== 0)
  })
  return { edges: sent(EDGES, EDGE_INDEX), corners: sent(CORNERS, CORNER_INDEX), axes, inside }
}

const shapeTurns = once(() => BLOCK_TURNS.map(turnOf))

/** A shape turned: each cell's content where the turn sends it, its axis
 *  turned with it if it went. */
function turned(shape: Shape, cells: Vec3[], to: number[], turn: ShapeTurn): Shape {
  const out = [...shape]
  shape.forEach((value, i) => {
    if (!turn.inside(cells[i]!)) return
    out[to[i]!] =
      value < 3 ? turn.axes[value]! : value === WHOLE ? value : 3 + turn.axes[value - 3]!
  })
  return out
}

/** The pairs' cuts on the edges (a whole piece seen as `WHOLE`), the
 *  whole pieces' places and ways (a pair seen as `WHOLE`). */
const cutsView = (edges: Shape) => edges.map((v) => (v < 3 ? v : WHOLE))
const wholeView = (edges: Shape) => edges.map((v) => (v < 3 ? WHOLE : v))

/** Distances to `goal`, every view the blocks reach. */
function distances(goal: Shape, cells: Vec3[], pick: (t: ShapeTurn) => number[]) {
  const seen = new Map([[goal.join(''), 0]])
  let frontier = [goal]
  for (let d = 1; frontier.length; d++) {
    const next: Shape[] = []
    for (const shape of frontier) {
      for (const turn of shapeTurns()) {
        const after = turned(shape, cells, pick(turn), turn)
        const look = after.join('')
        if (seen.has(look)) continue
        seen.set(look, d)
        next.push(after)
      }
    }
    frontier = next
  }
  return seen
}

const inEquator = (c: Vec3) => c[1] === 0
let cutDistances: Map<string, number> | undefined
let cornerDistances: Map<string, number> | undefined
/** By where the middle centers stand: their red one on the right or the
 *  left (the whole edges' red or orange there too), or a quarter round. */
const wholeDistances: (Map<string, number> | undefined)[] = [undefined, undefined]

/** The two tables every search needs, built once. */
function baseTables() {
  cutDistances ??= distances(
    EDGES.map((c) => (inEquator(c) ? WHOLE : 1)),
    EDGES,
    (t) => t.edges,
  )
  cornerDistances ??= distances(
    CORNERS.map(() => 1),
    CORNERS,
    (t) => t.corners,
  )
  return { cuts: cutDistances, corners: cornerDistances }
}

/** The blocks' turns that bring a shape to the box, fewest first (an IDA*
 *  search bounded by `bound`, 0 in the box), or null past 20. */
function searchBox(
  edges: Shape,
  corners: Shape,
  bound: (e: Shape, c: Shape) => number,
): Move[] | null {
  const path: number[] = []
  const search = (e: Shape, c: Shape, depth: number, last: number): boolean => {
    const h = bound(e, c)
    if (h === 0) return true
    if (h > depth) return false
    const turns = shapeTurns()
    for (let t = 0; t < turns.length; t++) {
      // Never the same side twice in a row (the turns go three by face).
      if (last >= 0 && Math.floor(t / 3) === Math.floor(last / 3)) continue
      const turn = turns[t]!
      path.push(t)
      if (
        search(
          turned(e, EDGES, turn.edges, turn),
          turned(c, CORNERS, turn.corners, turn),
          depth - 1,
          t,
        )
      )
        return true
      path.pop()
    }
    return false
  }
  for (let depth = 0; depth <= 20; depth++) {
    if (search(edges, corners, depth, -1)) return path.map((t) => BLOCK_TURNS[t]!)
  }
  return null
}

/** The blocks' turns back into the box, fewest first: every pair lying,
 *  the whole edges in the equator the way its centers say. */
export function backToBox(cube: Cube, shape: CubeShape): Move[] {
  const tables = baseTables()
  // The middle centers never move: where their red one stands says which
  // way the whole edges must face. A side center's cell: one coordinate
  // +-1, the others 0 (a half laid across the equator, out of the box, may
  // wear red too).
  const red = faceColorsOf(shape).R
  const center = cube.find(
    (c) =>
      c.position[1] === 0 &&
      c.position.filter((v) => v !== 0).length === 1 &&
      c.position.every((v) => Math.abs(v) <= 1) &&
      c.stickers[0]?.color === red,
  )!
  const quarter = center.position[0] === 0 ? 1 : 0
  const wholeGoal = EDGES.map((c) => (inEquator(c) ? 3 + (quarter ? 2 : 0) : WHOLE))
  const whole = (wholeDistances[quarter] ??= distances(wholeGoal, EDGES, (t) => t.edges))
  const start = shapesOf(cube, shape)
  const moves = searchBox(start.edges, start.corners, (e, c) =>
    Math.max(
      tables.cuts.get(cutsView(e).join(''))!,
      whole.get(wholeView(e).join(''))!,
      tables.corners.get(c.join(''))!,
    ),
  )
  if (!moves) throw new Error('fashionShape: no way back into the box')
  return moves
}

/** A cell of an edge or a corner, by its signs (`'1,1,0'`). */
export const FASHION_CELLS: { readonly edges: readonly Vec3[]; readonly corners: readonly Vec3[] } =
  { edges: EDGES, corners: CORNERS }

/**
 * The blocks' turns that bring a shape given cell by cell to the box (the
 * axis each pair is cut across, `WHOLE` for a whole edge), or null if no turn
 * reaches it: the whole edges' ways round left aside (a form is where the
 * pieces stand, not their colors).
 */
export function cutsToBox(edges: readonly number[], corners: readonly number[]): Move[] | null {
  const tables = baseTables()
  const known = (e: Shape, c: Shape) =>
    tables.cuts.has(e.join('')) && tables.corners.has(c.join(''))
  if (!known([...edges], [...corners])) return null
  return searchBox([...edges], [...corners], (e, c) =>
    Math.max(tables.cuts.get(cutsView(e).join(''))!, tables.corners.get(c.join(''))!),
  )
}
