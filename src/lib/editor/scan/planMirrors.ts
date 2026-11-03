import { FACE_COLOR, faceColorsOf } from '../../core/cube'
import type { CubeShape } from '../../core/shapes'
import { gridLayout } from './layout'
import type { ORDER, ScanFace, sizedOrder } from './plan'
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
