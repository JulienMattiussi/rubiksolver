import { faceColorsOf, shapeColors, solvedCube, turnDims } from '../../core/cube'
import { cross, dot, FACE_NORMAL, layerCoords, normalIndex, outerCoord } from '../../core/geometry'
import { tellsSizes } from '../../core/shape'
import {
  isGridless,
  SHAPE_DIMS,
  SHAPE_MIRROR_SCAN,
  SHAPE_SHIFTS,
  type CubeShape,
  type CubeVariant,
} from '../../core/shapes'
import { stickerId, type SlotTables } from '../editorTables'
import { gap, gridLayout, ringLayout, squareLayout, type FaceLayout, type Point } from './layout'
import { MODELS } from '../../puzzles/models'
import { outlineMark, type OutlineScan } from './outlines'
import type { Color, Cube, CubeColor, Dims, Face, Vec3 } from '../../core/types'

/**
 * How a puzzle is scanned with a camera, face by face (pure, no React): the
 * face shown, the one on top, how to get there from the face before, and
 * which sticker each cell of the picture is, laid out as layout.ts says: a
 * cube's face a grid (its dims say it all, a cuboid's faces just
 * rectangles), a Megaminx's a ring round its center (its model says which
 * sticker is where, `PuzzleModel.scan`), a Skewb's a square whose stickers
 * its drawing places (three/core/scanDrawing.ts). A puzzle with holes (the
 * Void Cube, the Holey Megaminx) skips them.
 */

/** How the puzzle is turned to show a face, from the one before: turned
 *  left, its top staying on top (`turn`) or its bottom at the bottom
 *  (`below`), tilted toward the lens, turned half round; `show`: told by
 *  its colors alone (a Megaminx's twelve faces); `upright`: the first face
 *  of a puzzle out of shape, its long side upright; `anchored`: the one
 *  face of a puzzle read whole, its anchor in the shape marked (`whole`). */
export type ScanMove =
  'first' | 'upright' | 'anchored' | 'turn' | 'below' | 'tilt' | 'flip' | 'show'

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
  /** A face of the box of a puzzle that changes shape (`scan: 'forms'`):
   *  its cells may show a sticker, a piece's black side or nothing, which
   *  its form says, found from them (forms.ts); its `cells` name the
   *  cells only. */
  readonly open?: true
  /** A face read whole from its picture, by its pieces' outlines (a
   *  Floppy Ghost: outlines.ts), its reader: its cells only tell when it is
   *  held still; its `mark`, where the piece that never moves goes. */
  readonly whole?: OutlineScan
  readonly mark?: readonly Point[]
  /** A mirror cube's face, read by the sizes of its stickers (sized.ts),
   *  named by its thickness: its picture kept whole, its center in `mark`. */
  readonly sized?: true
}

/** What a scan is read against: the puzzle, its faces as scanned, and the
 *  editor's tables of the form it stands in (its box, or a form a puzzle
 *  that changes shape was found in, forms.ts). */
export interface Scanned {
  readonly shape: CubeShape
  readonly plan: readonly ScanFace[]
  readonly tables: SlotTables
  /** The form, a state of it (none: its box). */
  readonly form?: Cube
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

/** The faces in order: the four sides, the top up (white), turning the
 *  puzzle left each time; then tilted toward oneself (the top comes in
 *  front, the back on top), then turned half round (the bottom in front). */
export const ORDER: readonly { front: Face; up: Face; move: ScanMove }[] = [
  { front: 'F', up: 'U', move: 'first' },
  { front: 'R', up: 'U', move: 'turn' },
  { front: 'B', up: 'U', move: 'turn' },
  { front: 'L', up: 'U', move: 'turn' },
  { front: 'U', up: 'R', move: 'tilt' },
  { front: 'D', up: 'R', move: 'flip' },
]

const SWAPPED: Record<Face, Face> = { F: 'F', B: 'B', U: 'U', D: 'D', L: 'R', R: 'L' }

/** The faces in order, shown to a camera facing the user (`behind`: a
 *  laptop's, its picture mirrored): told to turn the puzzle the way the
 *  mirrored picture shows ("to the right"), the user turns it the other way
 *  round, so the gestures come as their mirror image: left and right
 *  swapped (a tilt, a half turn, alike either way). Seen 2026-10-22 on a
 *  tower, 2026-10-24 on a mirror cube. */
export const orderFor = (behind: boolean) =>
  behind ? ORDER.map((o) => ({ ...o, front: SWAPPED[o.front], up: SWAPPED[o.up] })) : ORDER

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

/** Whether a puzzle can be scanned: one its model says how to scan, or a
 *  plain grid puzzle painted by its colors, a cube, a cuboid or a flat one
 *  (no model of its own building or entering it otherwise, no shifting);
 *  shown as a mirror, one whose card says its mirror scans. */
export function scannable(shape: CubeShape, variant: CubeVariant = 'classic'): boolean {
  if (tellsSizes(variant)) return SHAPE_MIRROR_SCAN[shape]
  const model = MODELS[shape]
  if (model?.scan) return true
  return !(model?.solved || model?.entry || isGridless(shape) || SHAPE_SHIFTS[shape])
}

const PLANS = new Map<string, readonly ScanFace[]>()
const SIZED = new Map<string, readonly ScanFace[]>()

/** A grid puzzle's faces, in `order`, without its holes. */
function gridFaces(shape: CubeShape, order: typeof ORDER) {
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
function squareFaces(shape: CubeShape, order: typeof ORDER) {
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
function boxFaces(shape: CubeShape, order: typeof ORDER) {
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
function wholeFaces(shape: CubeShape, scan: OutlineScan) {
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

/** A mirror cube's faces, in the order the scan's gestures show them,
 *  begun on the two easiest to tell (the thinnest, whose centers sit
 *  deepest): the thin one (D) in front, the very thin one (L) on top; the
 *  cube then turned as `orderFor` turns it (F to D, U to L, R to F...),
 *  `behind` as a camera facing the user sees it: each face named so, its
 *  name and its gesture agree. */
const SIZED_TURN: Record<Face, Face> = { F: 'D', U: 'L', R: 'F', B: 'U', D: 'R', L: 'B' }
export const sizedOrder = (behind: boolean) =>
  orderFor(behind).map(({ front, up, move }) => ({
    front: SIZED_TURN[front],
    up: SIZED_TURN[up],
    move,
  }))

/** Cells across the frame of a mirror cube's face (its stickers past its
 *  center reach 2.1 middle layers either way), held still by them. */
const SIZED_CELLS = 5

/** A mirror cube's faces, in `sizedOrder`, each named by its thickness (its
 *  centers, all alike, cannot tell how it is held), its center marked in
 *  the frame's middle cell: its cells only say when it is held still. */
function sizedFaces(shape: CubeShape, behind: boolean): ScanFace[] {
  const colors = faceColorsOf(shape)
  const grid = gridLayout(SIZED_CELLS, SIZED_CELLS)
  const [lo, hi] = [(SIZED_CELLS - 1) / 2, (SIZED_CELLS + 1) / 2]
  return sizedOrder(behind).map(({ front, up, move }) => ({
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

/** A puzzle's faces to scan, in order (see `scannable`): as a mirror, by
 *  its stickers' sizes; `behind`, filmed by a camera facing the user, the
 *  gestures mirrored (`orderFor`): its faces named, checked and read as
 *  they come. */
export function scanPlan(
  shape: CubeShape,
  variant: CubeVariant = 'classic',
  behind = false,
): readonly ScanFace[] {
  if (tellsSizes(variant)) {
    const key = `${shape}:sized:${behind}`
    const sized = SIZED.get(key) ?? sizedFaces(shape, behind)
    SIZED.set(key, sized)
    return sized
  }
  const key = `${shape}:${behind}`
  let plan = PLANS.get(key)
  if (!plan) {
    const own = MODELS[shape]?.scan
    const order = orderFor(behind)
    const rings = typeof own === 'function' ? own(behind) : undefined
    const faces: Omit<ScanFace, 'told' | 'named'>[] =
      typeof own === 'object'
        ? wholeFaces(shape, own)
        : own === 'square'
          ? squareFaces(shape, order)
          : own === 'forms'
            ? boxFaces(shape, order)
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
              : gridFaces(shape, order)
    // Centers tell the faces only if every face has one, where they stay
    // (not a Skewb's, which move about).
    const told = own !== 'square' && own !== 'forms' && faces.every((face) => face.center !== null)
    // A puzzle read by its outlines names no color (its colors only tell
    // its pieces apart, all silver).
    const named =
      typeof own !== 'object' && shapeColors(shape).every((color) => CUBE_COLORS.includes(color))
    plan = faces.map((face) => ({ ...face, told, named }))
    PLANS.set(key, plan)
  }
  return plan
}
