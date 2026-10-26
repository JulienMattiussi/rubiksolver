import { cubeOrientations, faceColorsOf, solvedCube, turnDims } from '../../core/cube'
import { cross, dot, FACE_NORMAL, layerCoords, normalIndex, outerCoord } from '../../core/geometry'
import { SHAPE_DIMS, type CubeShape } from '../../core/shapes'
import type { Dims, Face, Vec3 } from '../../core/types'
import { stickerId } from '../editorTables'
import {
  fitScale,
  gap,
  gridLayout,
  polygonFrame,
  ringLayout,
  squareLayout,
  type FaceLayout,
  type Point,
} from './layout'
import { outlineMark, type OutlineScan } from './outlines'
import type { FlatFace, ORDER, RingFace, ScanFace, ScanMove, sizedOrder } from './plan'

/**
 * The faces of a scan built (pure, plan.ts puts them in order): each its
 * layout (layout.ts), its cells' sticker ids, its gesture; a cube's face a
 * grid, a Skewb's a square its drawing places, a tower's a face of its box,
 * a Megaminx's a ring, a Floppy Ghost's its one picture, a mirror's a frame
 * round its center. A puzzle with holes skips them.
 */

/** How far each gesture turns a grid puzzle. */
const GRID_ANGLES: Partial<Record<ScanMove, number>> = { turn: 90, tilt: 90, flip: 180 }

export const axisOf = (v: Vec3): number => v.findIndex((x) => x !== 0)

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

/** A grid puzzle's faces, in `order`, without its holes. */
export function gridFaces(shape: CubeShape, order: typeof ORDER) {
  const colors = faceColorsOf(shape)
  const stickers = present(shape)
  return order.map(({ front, up, move }) => {
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

/** A grid puzzle's faces read as a grid, but framed round their center as
 *  a mirror cube's (`centered`): its cells in the middle of a frame two
 *  cells wider each way, no grid drawn, its center's cell marked, where a
 *  puzzle out of shape puts its center (the Windmill's need not sit in the
 *  middle of its solid). */
export function centeredFaces(shape: CubeShape, order: typeof ORDER) {
  return gridFaces(shape, order).map((face) => ({
    ...face,
    width: face.width + 2,
    height: face.height + 2,
    points: face.points.map(([x, y]): Point => [x + 1, y + 1]),
    outline: [
      [0, 0],
      [face.width + 2, 0],
      [face.width + 2, face.height + 2],
      [0, face.height + 2],
    ] as Point[],
    lines: [],
    mark: [
      [2, 2],
      [3, 2],
      [3, 3],
      [2, 3],
    ] as Point[],
    centered: true as const,
  }))
}

/** A cube whose faces are no grid, in `order`: each face its stickers, at
 *  their pieces' places across it (a frame 2 units wide, its middle at
 *  1, 1), which the view replaces by where its drawing shows them; turned
 *  a quarter, the face's places go round. */
export function squareFaces(shape: CubeShape, order: typeof ORDER) {
  const colors = faceColorsOf(shape)
  const solved = solvedCube(shape)
  return order.map(({ front, up, move }) => {
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
    const layout = squareLayout(
      on.map((s): Point => [1 + (0.75 * s.across) / far, 1 - (0.75 * s.upward) / far]),
    )
    const middle = layout.points.findIndex((p) => gap(p, [1, 1]) < 1e-6)
    return {
      ...layout,
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

/** How far out toward each side a flat face's outermost pieces sit. */
const FLAT_SHARE = 0.8

const unit = (v: readonly number[]): Vec3 => {
  const length = Math.hypot(...v)
  return [v[0]! / length, v[1]! / length, v[2]! / length]
}

/** A polyhedron's flat faces, in order (its model's, `PuzzleModel.scan:
 *  { flat }`): each its stickers (those it says it shows, `shown`), at
 *  their pieces' places across it, in a
 *  frame of its shape (a regular polygon, as many sides as the ways the
 *  puzzle shows it turned), which the view replaces by where its drawing
 *  shows them. The ways it can be held turned are the puzzle's own
 *  orientations keeping the face where it is, read cell by cell. */
export function flatFaces(shape: CubeShape, faces: readonly FlatFace[]) {
  const solved = solvedCube(shape)
  const orientations = cubeOrientations(solved)
  const same = (a: readonly number[], b: readonly number[]) => a.join() === b.join()
  return faces.map((face) => {
    const n = unit(face.normal)
    const across = dot(face.up, n)
    const up = unit(face.up.map((x, a) => x - across * n[a]!))
    const right = cross(up, n)
    const shown =
      face.shown ??
      ((position: Vec3, normal: Vec3) => (same(normal, face.normal) ? position : null))
    const on = solved.flatMap((c, i) =>
      c.stickers.flatMap((s) => {
        const at = shown(c.position, s.normal)
        if (!at) return []
        const id = stickerId(c.position, normalIndex(s.normal))
        return [{ i, color: s.color, id, at: [dot(at, right), dot(at, up)] as Point }]
      }),
    )
    const index = new Map(on.map((s, k) => [s.id, k]))
    // Each orientation keeping the face: where it takes each cell's sticker.
    const turns = new Map<string, number[]>()
    for (const turned of orientations) {
      const turn = on.map(({ i, color }) => {
        const c = turned[i]!
        const s = c.stickers.find((t) => t.color === color)!
        return index.get(stickerId(c.position, normalIndex(s.normal))) ?? -1
      })
      if (!turn.includes(-1)) turns.set(turn.join(), turn)
    }
    const frame = polygonFrame(face.sides ?? turns.size, face.pointDown)
    const scale = fitScale(
      on.map((s) => s.at),
      frame.outline,
      frame.middle,
      FLAT_SHARE,
    )
    const [mx, my] = frame.middle
    const points = on.map(({ at: [x, y] }): Point => [mx + scale * x, my - scale * y])
    const closest = Math.min(...points.flatMap((p, k) => points.slice(k + 1).map((q) => gap(p, q))))
    const middle = points.findIndex((p) => gap(p, frame.middle) < 1e-6)
    return {
      width: frame.width,
      height: frame.height,
      points,
      reach: 0.3 * closest,
      outline: frame.outline,
      lines: [],
      // The identity first (the first orientation is the puzzle as it is).
      turns: [...turns.values()],
      move: face.move,
      angle: face.angle ?? null,
      frontColor: face.frontColor,
      upColor: face.upColor,
      cells: on.map((s) => s.id),
      center: middle < 0 ? null : middle,
      seen: { normal: face.normal, up: face.up, middle: frame.middle },
    }
  })
}

/** The faces of the box a puzzle that changes shape turns in (its
 *  mechanism), in `order`, each a grid of its cells: what each shows, its
 *  form says (forms.ts). The first held its long side upright, each piece
 *  in a cell. */
export function boxFaces(shape: CubeShape, order: typeof ORDER) {
  const dims = turnDims(shape)
  return order.map(({ front, up, move }, f) => {
    const [rows, cols] = boxSides(dims, front, up)
    return {
      ...gridLayout(rows, cols),
      move: f ? move : ('upright' as const),
      angle: GRID_ANGLES[move] ?? null,
      frontColor: faceColorsOf(shape)[front],
      upColor: faceColorsOf(shape)[up],
      cells: Array.from({ length: rows * cols }, (_, i) => `${front}${i}`),
      center: null,
      open: true as const,
    }
  })
}

/** A box's face, seen with `up` on top: its rows, its columns. */
export function boxSides(dims: Dims, front: Face, up: Face): [number, number] {
  const u = FACE_NORMAL[up]
  const r = cross(u, FACE_NORMAL[front])
  return [dims[axisOf(u)]!, dims[axisOf(r)]!]
}

/** A puzzle whose cells hold halves (halves.ts): each face its 3 x 3
 *  cells drawn, each read as 2 x 2 sub-cells; its center telling it, held
 *  as told (no turn). */
export function halvesFaces(shape: CubeShape, order: typeof ORDER) {
  const colors = faceColorsOf(shape)
  const grid = gridLayout(HALVES, HALVES)
  const cells = gridLayout(3, 3)
  return order.map(({ front, up, move }) => ({
    ...grid,
    lines: cells.lines.map(([a, b]) => [scaled(a), scaled(b)] as const),
    turns: [grid.points.map((_, i) => i)],
    move,
    angle: GRID_ANGLES[move] ?? null,
    frontColor: colors[front],
    upColor: colors[up],
    cells: grid.points.map((_, i) => `${front}${i}`),
    // The top left of its middle four.
    center: (HALVES / 2 - 1) * HALVES + HALVES / 2 - 1,
    halves: true as const,
  }))
}

/** Sub-cells across a face read by halves; a cell's point in them. */
export const HALVES = 6
const scaled = ([x, y]: Point): Point => [x * 2, y * 2]

/** A gear's cell, by its clip's sticker id. */
export const GEAR = 'gear:'

/** How far in from its side a gear and a clip show, in a face 3 cells
 *  wide: the drawing's gear (31 of 300); a real Ultimate's clip, a bracket
 *  round black, read on all of it (photos, 2026-10-26). */
const GEAR_IN = 0.31
const CLIP_IN = 0.95
const CLIP_REACH = 0.22

/** The points of a grid face of a 3x3 with gears: each edge cell's clip,
 *  its gear's besides where it has one (`geared`, by cell). */
function gearLayout(grid: FaceLayout, geared: readonly boolean[]) {
  // Toward each edge cell's side: up, left, right, down.
  const sides: Record<number, Point> = { 1: [0, -1], 3: [-1, 0], 5: [1, 0], 7: [0, 1] }
  const at = (i: number, inward: number): Point => {
    const [dx, dy] = sides[i]!
    return [1.5 + dx * (1.5 - inward), 1.5 + dy * (1.5 - inward)]
  }
  const points = grid.points.map((p, i) => (i in sides && geared[i] ? at(i, CLIP_IN) : p))
  const gears = [1, 3, 5, 7].filter((i) => geared[i])
  const all = [...points, ...gears.map((i) => at(i, GEAR_IN))]
  // A quarter turn clockwise about the middle (y down): its points where
  // they come, if each lands on one.
  const quarter = ([x, y]: Point): Point => [3 - y, x]
  const index = (p: Point) => all.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6)
  const turns: number[][] = []
  for (let k = 0; k < 4; k++) {
    const turn = all.map((p) => {
      let q = p
      for (let j = 0; j < k; j++) q = quarter(q)
      return index(q)
    })
    if (!turn.includes(-1)) turns.push(turn)
  }
  const clips = [1, 3, 5, 7].filter((i) => geared[i])
  return { points: all, gears, turns, thin: { points: clips, reach: CLIP_REACH } }
}

/** Whether the piece holding a sticker has a gear (a spin). */
function gearedCells(shape: CubeShape, cells: readonly string[]): boolean[] {
  const geared = new Set(
    solvedCube(shape).flatMap((c) =>
      c.spin === undefined
        ? []
        : c.stickers.map((s) => stickerId(c.position, normalIndex(s.normal))),
    ),
  )
  return cells.map((id) => geared.has(id))
}

/** A Gear Cube's faces, its clips bearing colors (gears.ts): a 3x3's,
 *  each edge read on its clip and on its gear. */
export function gearFaces(shape: CubeShape, order: typeof ORDER) {
  return gridFaces(shape, order).map((face) => {
    const { points, gears, turns, thin } = gearLayout(face, gearedCells(shape, face.cells))
    return {
      ...face,
      points,
      turns,
      thin,
      reach: GEAR_REACH,
      cells: [...face.cells, ...gears.map((i) => `${GEAR}${face.cells[i]!}`)],
      gears: true as const,
    }
  })
}

/** How far round its point a gear's color is read, or a corner's. */
const GEAR_REACH = 0.06

/** Cells across the frame of a face read whole, held still by them. */
const WHOLE_CELLS = 5

/** A puzzle read whole from one picture (outlines.ts): one face, its
 *  anchor marked; its cells, which only say when it is held still. */
export function wholeFaces(shape: CubeShape, scan: OutlineScan) {
  const colors = faceColorsOf(shape)
  const grid = gridLayout(WHOLE_CELLS, WHOLE_CELLS)
  return [
    {
      ...grid,
      lines: [],
      move: 'anchored' as const,
      angle: null,
      frontColor: colors.F,
      upColor: colors.U,
      cells: grid.points.map((_, i) => `F${i}`),
      center: null,
      whole: scan,
      mark: outlineMark(scan, WHOLE_CELLS),
    },
  ]
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

/** A puzzle scanned face by face, each a ring round its center (its
 *  model's, `PuzzleModel.scan`), without its holes. */
export function ringFaces(shape: CubeShape, rings: readonly RingFace[]) {
  return rings.map((ring, f) =>
    withoutHoles(
      {
        ...ringLayout((ring.cells.length - 1) / 2, ring.bottom, ring.deep),
        ...ring,
        move: ring.move ?? (f ? 'show' : 'first'),
        angle: ring.angle ?? null,
        center: 0,
      },
      present(shape),
    ),
  )
}

/** Cells across the frame of a mirror cube's face (its stickers past its
 *  center reach 2.1 middle layers either way), held still by them. */
const SIZED_CELLS = 5

/** A mirror cube's faces, in `order` (`sizedOrder`), each named by its thickness (its
 *  centers, all alike, cannot tell how it is held), its center marked in
 *  the frame's middle cell: its cells only say when it is held still. */
export function sizedFaces(shape: CubeShape, order: ReturnType<typeof sizedOrder>): ScanFace[] {
  const colors = faceColorsOf(shape)
  const grid = gridLayout(SIZED_CELLS, SIZED_CELLS)
  const [lo, hi] = [(SIZED_CELLS - 1) / 2, (SIZED_CELLS + 1) / 2]
  return order.map(({ front, up, move }) => ({
    ...grid,
    lines: [],
    move,
    angle: GRID_ANGLES[move] ?? null,
    frontColor: colors[front],
    upColor: colors[up],
    cells: grid.points.map((_, i) => `${front}${i}`),
    center: null,
    mark: [
      [lo, lo],
      [hi, lo],
      [hi, hi],
      [lo, hi],
    ],
    sized: true,
    told: true,
    named: false,
  }))
}
