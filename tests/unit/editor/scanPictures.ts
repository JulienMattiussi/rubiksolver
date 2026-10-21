import { cubeOrientations, solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { scramble } from '@/lib/core/moves'
import { cubeToEdit } from '@/lib/editor/edit'
import { scanPlan } from '@/lib/editor/scan/plan'
import { sampleGrid, type CellSample, type Pixels } from '@/lib/editor/scan/sample'
import type { EditStickers } from '@/lib/editor/entry'
import type { Color, CubeColor } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'
import { seededRng } from '../../helpers'

/** Pictures of a cube's faces, made up for the scan's tests. */

/** Stickers as a camera might see them. */
export const RGB: Record<CubeColor, readonly [number, number, number]> = {
  W: [235, 235, 232],
  Y: [250, 210, 30],
  G: [0, 160, 80],
  B: [0, 80, 190],
  O: [255, 110, 10],
  R: [190, 20, 55],
}

/** A face's picture: its stickers on black plastic, under a warm light
 *  (`tint`), with some noise. */
export function picture(
  colors: readonly Color[],
  rows: number,
  cols: number,
  rng: () => number,
  tint = [1.05, 1, 0.85],
): Pixels {
  const cell = 20
  const [width, height] = [cols * cell, rows * cell]
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const edge = x % cell < 2 || y % cell < 2
      const rgb = edge
        ? [10, 10, 10]
        : RGB[colors[Math.floor(y / cell) * cols + Math.floor(x / cell)] as CubeColor]
      const k = (y * width + x) * 4
      for (let c = 0; c < 3; c++) data[k + c] = rgb[c]! * tint[c]! + (rng() - 0.5) * 16
      data[k + 3] = 255
    }
  }
  return { width, height, data }
}

/** Each face of a state scanned, in the plan's order, held as told. */
export function scanOf(
  shape: CubeShape,
  seed: number,
): { faces: CellSample[][]; edit: EditStickers } {
  const rng = seededRng(seed)
  const plan = scanPlan(shape)
  const scrambled = applyMoves(solvedCube(shape), scramble(shape, 30, rng))
  // Held as the instructions say, each face's center toward the lens in
  // its turn (a 5x5's middle slices move them).
  const edit = cubeOrientations(scrambled)
    .map(cubeToEdit)
    .find((e) =>
      plan.every((face) => face.center === null || e[face.cells[face.center]!] === face.frontColor),
    )!
  const faces = plan.map((face) =>
    sampleGrid(
      picture(
        face.cells.map((id) => edit[id]!),
        face.rows,
        face.cols,
        rng,
      ),
      face.rows,
      face.cols,
    ),
  )
  return { faces, edit }
}
