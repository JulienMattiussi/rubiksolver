import { faceColorsOf, shapeColors, solvedCube } from '../../core/cube'
import { FACE_NORMAL, layerCoords, normalIndex, outerCoord } from '../../core/geometry'
import { isGridless, SHAPE_DIMS, SHAPE_SHIFTS, type CubeShape } from '../../core/shapes'
import { stickerId } from '../editorTables'
import { MODELS } from '../../puzzles/models'
import type { Color, CubeColor, Face, Vec3 } from '../../core/types'

/**
 * How a puzzle is scanned with a camera, face by face (pure, no React): the
 * face shown, the one on top, how to get there from the face before, and
 * which sticker each cell of the picture is, and where. A face is a set of
 * points to read in its frame, an outline and lines to draw, and the ways
 * it can be held turned: a cube's is a grid (its dims say it all, a
 * cuboid's faces just rectangles), a Megaminx's a ring round its center
 * (its model says which sticker is where, `PuzzleModel.scan`). A grid
 * puzzle with holes (the Void Cube) skips them.
 */

/** How the puzzle is turned to show a face, from the one before: turned
 *  left, its top staying on top (`turn`) or its bottom at the bottom
 *  (`below`), tilted toward the lens, turned half round; `show`: told by
 *  its colors alone (a Megaminx's twelve faces). */
export type ScanMove = 'first' | 'turn' | 'below' | 'tilt' | 'flip' | 'show'

export type Point = readonly [number, number]

/** Where a face's cells are, in its frame (`width` by `height` units, from
 *  its top left). */
export interface FaceLayout {
  readonly width: number
  readonly height: number
  /** Each cell's middle, where it is read. */
  readonly points: readonly Point[]
  /** How far round each point it is read, each way. */
  readonly reach: number
  /** The frame's outline, and its lines in watermark. */
  readonly outline: readonly Point[]
  readonly lines: readonly (readonly [Point, Point])[]
  /** Each way it can be held turned, the identity first: the cell each
   *  cell then reads (`turned[i] = cells[turn[i]]`). */
  readonly turns: readonly (readonly number[])[]
}

export interface ScanFace extends FaceLayout {
  readonly move: ScanMove
  /** How far the gesture turns the puzzle, in degrees (none: the first
   *  face, one told by its colors). */
  readonly angle: number | null
  /** The solved colors of the face shown and of the one on top, which the
   *  texts name when the face has a center telling it. */
  readonly frontColor: Color
  readonly upColor: Color
  /** The sticker id of each cell, as its points. */
  readonly cells: readonly string[]
  /** The cell that holds the face's center, if it has one: a reference
   *  for its colors (anchors.ts) and, `told`, what tells the face. */
  readonly center: number | null
  /** Its center says which face it is (a 3x3's, fixed): the texts name its
   *  colors and the camera checks it. Else (an even cube, most cuboids, a
   *  Skewb whose centers move) the puzzle is held any way, shown by
   *  gestures, its colors told apart among themselves. */
  readonly told: boolean
  /** On a cube whose faces are no grid (`PuzzleModel.scan: 'square'`): its
   *  normal and the one on top, for its drawing to say where each sticker
   *  shows (the view replaces the layout by it). */
  readonly seen?: { readonly normal: Vec3; readonly up: Vec3 }
  /** Its colors have names a camera can tell (a cube's six); else the
   *  scan reads its measures only, its colors told at the end (a
   *  Megaminx's twelve). */
  readonly named: boolean
}

/** A face as a model declares it (`PuzzleModel.scan`): its colors, then
 *  its stickers, its center's, then its edges' clockwise from the one on
 *  top, then its corners' (each the one after its edge, clockwise). */
export interface RingFace {
  readonly frontColor: Color
  readonly upColor: Color
  readonly cells: readonly string[]
  /** Held with a side flat at the bottom (a point on top), its cells read
   *  from that side; and the gesture that shows it, if not by its colors
   *  (a Holey Megaminx, which has no centers to tell it). */
  readonly bottom?: true
  readonly move?: ScanMove
  readonly angle?: number
}

/** How far each gesture turns a grid puzzle. */
const GRID_ANGLES: Partial<Record<ScanMove, number>> = { turn: 90, tilt: 90, flip: 180 }

const CUBE_COLORS: readonly Color[] = ['W', 'Y', 'G', 'B', 'O', 'R'] satisfies CubeColor[]

/** A grid of `rows` by `cols`, a unit a cell: read on the middle 40% of
 *  each cell (its borders may hold the plastic, or the next sticker when
 *  the cube is not exactly the frame's size). Square, it turns by
 *  quarters; else by halves only. */
export function gridLayout(rows: number, cols: number): FaceLayout {
  const points: Point[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) points.push([col + 0.5, row + 0.5])
  }
  const lines: [Point, Point][] = [
    ...Array.from({ length: cols - 1 }, (_, i): [Point, Point] => [
      [i + 1, 0],
      [i + 1, rows],
    ]),
    ...Array.from({ length: rows - 1 }, (_, i): [Point, Point] => [
      [0, i + 1],
      [cols, i + 1],
    ]),
  ]
  const ids = points.map((_, i) => i)
  // Row r of the picture turned a quarter is column r of this one, upward.
  const quarter = (from: readonly number[]) =>
    from.map((_, i) => from[(cols - 1 - (i % cols)) * cols + Math.floor(i / cols)]!)
  const half = [...ids].reverse()
  return {
    width: cols,
    height: rows,
    points,
    reach: 0.2,
    outline: [
      [0, 0],
      [cols, 0],
      [cols, rows],
      [0, rows],
    ],
    lines,
    turns: rows === cols ? [ids, quarter(ids), half, quarter(half)] : [ids, half],
  }
}

/** A regular polygon of `sides`, a flat side on top (or at the bottom,
 *  turned half round), round its center: the center, then the edges
 *  clockwise from that side, then the corners (the proportions of a
 *  Megaminx's face). It turns by a side at a time. */
function ringLayout(sides: number, bottom = false): FaceLayout {
  const layout = flatTopRing(sides)
  if (!bottom) return layout
  const { width, height } = layout
  const half = ([x, y]: Point): Point => [width - x, height - y]
  return {
    ...layout,
    points: layout.points.map(half),
    outline: layout.outline.map(half),
    lines: layout.lines.map(([a, b]) => [half(a), half(b)] as const),
  }
}

function flatTopRing(sides: number): FaceLayout {
  const step = (2 * Math.PI) / sides
  // Clockwise from the top, y down; corners half a step on.
  const at = (k: number, r: number): Point => {
    const angle = Math.PI / 2 - k * step
    return [r * Math.cos(angle), -r * Math.sin(angle)]
  }
  const corner = (k: number) => at(k + 0.5, 1)
  const xs = Array.from({ length: sides }, (_, k) => corner(k)[0])
  const ys = Array.from({ length: sides }, (_, k) => corner(k)[1])
  const [left, top] = [Math.min(...xs), -Math.cos(step / 2)]
  const move = ([x, y]: Point): Point => [x - left, y - top]
  const ks = Array.from({ length: sides }, (_, k) => k)
  const points = [
    [0, 0] as Point,
    ...ks.map((k) => at(k, 0.58)),
    ...ks.map((k) => at(k + 0.5, 0.72)),
  ]
  // The cuts: each parallel to a side, through the center's pentagon,
  // across to the two sides beside it.
  const inner = (k: number) => at(k + 0.5, 0.42)
  const cross = (p: Point, q: Point, a: Point, b: Point): Point => {
    const [dx, dy, ex, ey] = [q[0] - p[0], q[1] - p[1], b[0] - a[0], b[1] - a[1]]
    const t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / (dx * ey - dy * ex)
    return [p[0] + t * dx, p[1] + t * dy]
  }
  const cut = (k: number): [Point, Point] => {
    const [p, q] = [inner(k - 1), inner(k)]
    return [cross(p, q, corner(k - 2), corner(k - 1)), cross(p, q, corner(k), corner(k + 1))]
  }
  const turn = (by: number) => [
    0,
    ...ks.map((k) => 1 + ((k + by) % sides)),
    ...ks.map((k) => 1 + sides + ((k + by) % sides)),
  ]
  return {
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
    points: points.map(move),
    reach: 0.07,
    outline: ks.map((k) => move(corner(k))),
    lines: ks.map((k) => cut(k).map(move) as [Point, Point]),
    turns: ks.map(turn),
  }
}

/** The faces in order: the four sides, the top up (white), turning the
 *  puzzle left each time; then tilted toward oneself (the top comes in
 *  front, the back on top), then turned half round (the bottom in front). */
const ORDER: readonly { front: Face; up: Face; move: ScanMove }[] = [
  { front: 'F', up: 'U', move: 'first' },
  { front: 'R', up: 'U', move: 'turn' },
  { front: 'B', up: 'U', move: 'turn' },
  { front: 'L', up: 'U', move: 'turn' },
  { front: 'U', up: 'R', move: 'tilt' },
  { front: 'D', up: 'R', move: 'flip' },
]

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

const axisOf = (v: Vec3): number => v.findIndex((x) => x !== 0)

/** The sticker ids of a face seen from outside, `up` on top: its right is
 *  up x front (right-handed), each axis' layers read along that side. */
function faceCells(shape: CubeShape, front: Face, up: Face) {
  const dims = SHAPE_DIMS[shape]
  const n = FACE_NORMAL[front]
  const u = FACE_NORMAL[up]
  const r = cross(u, n)
  const [na, ua, ra] = [axisOf(n), axisOf(u), axisOf(r)]
  const rows = dims[ua]!
  const cols = dims[ra]!
  const along = (v: Vec3, axis: number) => layerCoords(dims[axis]!).map((c) => c * v[axis]!)
  // Rows from the top: up's coordinate going down; columns going right.
  const downs = [...along(u, ua)].reverse()
  const rights = along(r, ra)
  const cells: string[] = []
  for (const y of downs) {
    for (const x of rights) {
      const p: [number, number, number] = [0, 0, 0]
      p[na] = outerCoord(dims[na]!, n[na]! > 0 ? 1 : -1)
      p[ua] = y
      p[ra] = x
      cells.push(stickerId(p, normalIndex(n)))
    }
  }
  return { rows, cols, cells }
}

/** Whether a puzzle can be scanned: one its model says how to scan, or a
 *  plain grid puzzle painted by its colors, a cube, a cuboid or a flat one
 *  (no model of its own building or entering it otherwise, no shifting). */
export function scannable(shape: CubeShape): boolean {
  const model = MODELS[shape]
  if (model?.scan) return true
  return !(model?.solved || model?.entry || isGridless(shape) || SHAPE_SHIFTS[shape])
}

const PLANS = new Map<CubeShape, readonly ScanFace[]>()

/** A grid puzzle's faces, in `ORDER`, without its holes. */
function gridFaces(shape: CubeShape) {
  const colors = faceColorsOf(shape)
  const stickers = present(shape)
  return ORDER.map(({ front, up, move }) => {
    const { rows, cols, cells } = faceCells(shape, front, up)
    const center = rows % 2 && cols % 2 ? (rows * cols - 1) / 2 : null
    const face = {
      ...gridLayout(rows, cols),
      move,
      angle: GRID_ANGLES[move] ?? null,
      frontColor: colors[front],
      upColor: colors[up],
      cells,
      center,
    }
    return withoutHoles(face, stickers)
  })
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** A cube whose faces are no grid, in `ORDER`: each face its stickers, at
 *  their pieces' places across it (a frame 2 units wide, its middle at
 *  1, 1), which the view replaces by where its drawing shows them; turned
 *  a quarter, the face's places go round. */
function squareFaces(shape: CubeShape) {
  const colors = faceColorsOf(shape)
  const solved = solvedCube(shape)
  return ORDER.map(({ front, up, move }) => {
    const [n, u] = [FACE_NORMAL[front], FACE_NORMAL[up]]
    const r = cross(u, n)
    const on = solved.flatMap((c) =>
      c.stickers
        .filter((s) => s.normal.join() === n.join())
        .map((s) => ({
          id: stickerId(c.position, normalIndex(s.normal)),
          across: dot(c.position, r),
          upward: dot(c.position, u),
        })),
    )
    const far = Math.max(1, ...on.flatMap((s) => [Math.abs(s.across), Math.abs(s.upward)]))
    // Inside the face, its outermost pieces three quarters of the way out.
    const points = on.map((s): Point => [1 + (0.75 * s.across) / far, 1 - (0.75 * s.upward) / far])
    const near = (p: Point, q: Point) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6
    // Read round each point, short of the next one.
    const closest = Math.min(
      ...points.flatMap((p, i) =>
        points.slice(i + 1).map((q) => Math.hypot(p[0] - q[0], p[1] - q[1])),
      ),
    )
    const quarter = points.map(([x, y]) => points.findIndex((q) => near(q, [2 - y, x])))
    const ids = points.map((_, i) => i)
    const times = (k: number) =>
      ids.map((i) => Array.from({ length: k }).reduce<number>((j) => quarter[j]!, i))
    const square = !quarter.includes(-1)
    const middle = points.findIndex((p) => near(p, [1, 1]))
    return {
      width: 2,
      height: 2,
      points,
      reach: 0.3 * closest,
      outline: [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
      ] as Point[],
      lines: [],
      turns: square ? [ids, times(1), times(2), times(3)] : [ids],
      move,
      angle: GRID_ANGLES[move] ?? null,
      frontColor: colors[front],
      upColor: colors[up],
      cells: on.map((s) => s.id),
      center: middle < 0 ? null : middle,
      seen: { normal: n, up: u },
    }
  })
}

/** The stickers a puzzle has (a Void Cube has no centers). */
const present = (shape: CubeShape) =>
  new Set(
    solvedCube(shape).flatMap((c) =>
      c.stickers.map((s) => stickerId(c.position, normalIndex(s.normal))),
    ),
  )

/** A face without the cells where its puzzle has a hole: a turn of the
 *  face takes a hole to a hole, so its turns keep to the others. */
function withoutHoles<F extends Omit<ScanFace, 'named' | 'told'>>(
  face: F,
  stickers: ReadonlySet<string>,
): F {
  const keep = face.cells.flatMap((id, i) => (stickers.has(id) ? [i] : []))
  if (keep.length === face.cells.length) return face
  const to = new Map(keep.map((i, j) => [i, j]))
  return {
    ...face,
    cells: keep.map((i) => face.cells[i]!),
    points: keep.map((i) => face.points[i]!),
    center: face.center !== null ? (to.get(face.center) ?? null) : null,
    turns: face.turns.map((turn) => keep.map((i) => to.get(turn[i]!)!)),
  }
}

/** A puzzle's faces to scan, in order (see `scannable`). */
export function scanPlan(shape: CubeShape): readonly ScanFace[] {
  let plan = PLANS.get(shape)
  if (!plan) {
    const own = MODELS[shape]?.scan
    const rings = typeof own === 'function' ? own() : undefined
    const faces =
      own === 'square'
        ? squareFaces(shape)
        : rings
          ? rings.map((ring, f) =>
              withoutHoles(
                {
                  ...ringLayout((ring.cells.length - 1) / 2, ring.bottom),
                  ...ring,
                  move: ring.move ?? (f ? 'show' : 'first'),
                  angle: ring.angle ?? null,
                  center: 0,
                },
                present(shape),
              ),
            )
          : gridFaces(shape)
    // Centers tell the faces only if every face has one, where they stay
    // (not a Skewb's, which move about).
    const told = own !== 'square' && faces.every((face) => face.center !== null)
    const named = shapeColors(shape).every((color) => CUBE_COLORS.includes(color))
    plan = faces.map((face) => ({ ...face, told, named }))
    PLANS.set(shape, plan)
  }
  return plan
}
