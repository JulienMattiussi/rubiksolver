import { shapeColors } from '../../core/cube'
import { tellsSizes } from '../../core/shape'
import {
  isGridless,
  SHAPE_MIRROR_SCAN,
  SHAPE_SHIFTS,
  type CubeShape,
  type CubeVariant,
} from '../../core/shapes'
import type { Color, Cube, CubeColor, Face, Vec3 } from '../../core/types'
import { MODELS } from '../../puzzles/models'
import type { SlotTables } from '../editorTables'
import type { FaceLayout, Point } from './layout'
import type { OutlineScan } from './outlines'
import {
  boxFaces,
  centeredFaces,
  flatFaces,
  gridFaces,
  ringFaces,
  sizedFaces,
  squareFaces,
  wholeFaces,
} from './planFaces'

/**
 * How a puzzle is scanned with a camera, face by face (pure, no React): the
 * face shown, the one on top, how to get there from the face before, and
 * which sticker each cell of the picture is, laid out as layout.ts says: a
 * cube's face a grid (its dims say it all, a cuboid's faces just
 * rectangles), a Megaminx's a ring round its center (its model says which
 * sticker is where, `PuzzleModel.scan`), a Skewb's a square whose stickers
 * its drawing places (three/core/scanDrawing.ts); a tower's, a face of the
 * box it turns in (forms.ts), a Floppy Ghost's, its one picture read whole
 * (outlines.ts), a mirror's, read by its stickers' sizes (sizedRead.ts). A
 * puzzle with holes (the Void Cube, the Holey Megaminx) skips them. Shown to
 * a camera facing the user, the gestures come mirrored (`orderFor`).
 */

/** How the puzzle is turned to show a face, from the one before: turned
 *  left, its top staying on top (`turn`) or its bottom at the bottom
 *  (`below`), tilted toward the lens, turned half round; a polyhedron
 *  turned left about its top point (`spin`), its bottom raised toward the
 *  lens (`topple`), turned upside down, its bottom point up (`upend`);
 *  `show`: told by
 *  its colors alone (a Megaminx's twelve faces); `upright`: the first face
 *  of a puzzle out of shape, its long side upright; `anchored`: the one
 *  face of a puzzle read whole, its anchor in the shape marked (`whole`). */
export type ScanMove =
  | 'first'
  | 'upright'
  | 'anchored'
  | 'turn'
  | 'below'
  | 'tilt'
  | 'flip'
  | 'show'
  | 'spin'
  | 'topple'
  | 'upend'

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
  /** On a cube whose faces are no grid (`PuzzleModel.scan: 'square'`), or
   *  a polyhedron's flat face (`flat`): its normal and the way up, for its
   *  drawing to say where each sticker shows (the view replaces the layout
   *  by it); on a flat face, the frame's middle, the face filling its
   *  outline side to side. */
  readonly seen?: {
    readonly normal: Vec3
    readonly up: Vec3
    readonly middle?: Point
  }
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
  /** The solid a polyhedron is, scanned by its flat faces (its gestures'
   *  arrows draw it; none: a cube). */
  readonly solid?: Solid
  /** A grid face framed round its center as a mirror cube's
   *  (`PuzzleModel.scan: 'centered'`): its cuts drawn from its center's
   *  cell, no outline, its cells read where a grid's are. */
  readonly centered?: true
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
  /** Its cuts through its middle (a Pyraminx Crystal's), drawn so. */
  readonly deep?: true
}

/** A flat face of a polyhedron as its model declares it (`PuzzleModel.scan:
 *  { flat }`): its outward normal, the way up across it (toward its corner
 *  on top, or the middle of its side on top, `pointDown`), its colors, and
 *  the gesture that shows it. */
export interface FlatFace {
  readonly normal: Vec3
  readonly up: Vec3
  readonly pointDown?: true
  /** Its sides, when the puzzle's turns do not say (a Skewb Ultimate's
   *  pentagon, which no turn of it keeps in place). */
  readonly sides?: number
  readonly frontColor: Color
  readonly upColor: Color
  readonly move: ScanMove
  readonly angle?: number
}

/** The solid a puzzle scanned by its flat faces is, drawn in its gestures'
 *  arrows (none: a cube). */
type Solid = 'pyramid' | 'octahedron' | 'dodecahedron'

/** A model scanned by its flat faces, in order (`behind`: shown to a
 *  camera facing the user, its gestures mirrored). */
export interface FlatScan {
  readonly flat: (behind: boolean) => readonly FlatFace[]
  readonly solid: Solid
}

/** The six colors a camera can name. */
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
    const sized = SIZED.get(key) ?? sizedFaces(shape, sizedOrder(behind))
    SIZED.set(key, sized)
    return sized
  }
  const key = `${shape}:${behind}`
  let plan = PLANS.get(key)
  if (!plan) {
    const own = MODELS[shape]?.scan
    const order = orderFor(behind)
    const rings = typeof own === 'function' ? own(behind) : undefined
    // A polyhedron scanned by its flat faces.
    const flat = typeof own === 'object' && 'flat' in own
    const faces: Omit<ScanFace, 'told' | 'named'>[] =
      typeof own === 'object' && 'flat' in own
        ? flatFaces(shape, own.flat(behind)).map((face) => ({ ...face, solid: own.solid }))
        : typeof own === 'object'
          ? wholeFaces(shape, own)
          : own === 'centered'
            ? centeredFaces(shape, order)
            : own === 'square'
              ? squareFaces(shape, order)
              : own === 'forms'
                ? boxFaces(shape, order)
                : rings
                  ? ringFaces(shape, rings)
                  : gridFaces(shape, order)
    // Centers tell the faces only if every face has one, where they stay
    // (not a Skewb's, which move about, nor a pyramid's).
    const told =
      !flat && own !== 'square' && own !== 'forms' && faces.every((face) => face.center !== null)
    // A puzzle read by its outlines names no color (its colors only tell
    // its pieces apart, all silver).
    const named =
      (typeof own !== 'object' || flat) &&
      shapeColors(shape).every((color) => CUBE_COLORS.includes(color))
    plan = faces.map((face) => ({ ...face, told, named }))
    PLANS.set(key, plan)
  }
  return plan
}
