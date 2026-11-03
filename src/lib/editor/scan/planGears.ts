import { solvedCube } from '../../core/cube'
import { normalIndex } from '../../core/geometry'
import type { CubeShape } from '../../core/shapes'
import { stickerId } from '../editorTables'
import type { FaceLayout, Point } from './layout'
import type { ORDER } from './plan'
import { gridFaces } from './planFaces'

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
