import { faceColorsOf, solvedCube, turnDims } from '../../core/cube'
import { cross, dot, FACE_NORMAL, layerCoords, normalIndex, outerCoord } from '../../core/geometry'
import { SHAPE_DIMS, type CubeShape } from '../../core/shapes'
import type { Dims, Face, Vec3 } from '../../core/types'
import { stickerId } from '../editorTables'
import { gap, gridLayout, ringLayout, squareLayout, type Point } from './layout'
import { outlineMark, type OutlineScan } from './outlines'
import type { ORDER, RingFace, ScanFace, ScanMove, sizedOrder } from './plan'

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
        ...ringLayout((ring.cells.length - 1) / 2, ring.bottom),
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
