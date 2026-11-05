import { FACE_COLOR, faceColorsOf, shapeColors } from '../../core/cube'
import type { CubeShape } from '../../core/shapes'
import type { Face } from '../../core/types'
import { FACES } from '../modes/faceViews'
import { gridLayout } from './layout'
import type { ORDER, ScanFace, ScanMove, sizedOrder } from './plan'
import { GRID_ANGLES } from './planFaces'

/** Cells across the frame of a 2x2 mirror's face: a layer each, its
 *  stickers reaching 1.2 either way of where they meet. */
const CROSS_CELLS = 4

/** A 2x2 mirror's faces, in `order` (`orderFor`), held any way (its corners
 *  tell no face): where its four stickers meet on the frame's middle,
 *  drawn as a cross; its cells only say when it is held still. */
export function crossFaces(order: typeof ORDER): ScanFace[] {
  const grid = gridLayout(CROSS_CELLS, CROSS_CELLS)
  return order.map(({ front, up, move }) => ({
    ...grid,
    lines: [],
    move: move === 'first' ? 'crossed' : move,
    angle: GRID_ANGLES[move] ?? null,
    frontColor: FACE_COLOR[front],
    upColor: FACE_COLOR[up],
    cells: grid.points.map((_, i) => `${front}${i}`),
    center: null,
    sized: true,
    cross: true,
    told: false,
    named: false,
  }))
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

/** Cells across the frame of a face entered on canvases: its widest (five
 *  mini cubes on Meffert's Pocket Cube) and room round it. */
const CANVAS_CELLS = 6

/** A puzzle entered on canvases (modes/canvas.ts), its four faces in their
 *  order (`FACES`: any face first, then each time turned left, easier in
 *  hand than tilted: its pictures read a quarter round, `gridCanvas`), then
 *  its top tilted toward the lens and its bottom, turned half round (its
 *  sides, sides.ts: what tells two shapes apart, and the stickers on
 *  them): its frame drawn, its cells' dots shown, its picture kept to read
 *  its stickers on (canvasRead.ts). */
export function canvasFaces(shape: CubeShape): Omit<ScanFace, 'told' | 'named'>[] {
  const grid = gridLayout(CANVAS_CELLS, CANVAS_CELLS)
  const colors = shapeColors(shape)
  const face = (front: Face, up: Face, move: ScanMove) => ({
    ...grid,
    // No lines: its stickers are placed where they stand, not where drawn.
    lines: [],
    move,
    angle: GRID_ANGLES[move] ?? null,
    frontColor: FACE_COLOR[front],
    upColor: FACE_COLOR[up],
    cells: grid.points.map((_, i) => `${front}${i}`),
    center: null,
    sized: true as const,
    canvas: colors,
  })
  return [
    ...FACES.map((front, f) => face(front, FACES[(f + 1) % FACES.length]!, f ? 'turn' : 'any')),
    // Its sides (sides.ts), its top then its bottom.
    face('R', 'F', 'tilt'),
    face('L', 'F', 'flip'),
  ]
}
