import { cubeOrientations, solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { scrambleTurns } from '@/lib/core/moves'
import { cubeToEdit } from '@/lib/editor/edit'
import { rgbOfHex } from '@/lib/editor/scan/color'
import { COLOR_HEX } from '@/lib/core/stickerColors'
import { gridLayout, scanPlan, type FaceLayout } from '@/lib/editor/scan/plan'
import { sampleFace, type CellSample, type Pixels } from '@/lib/editor/scan/sample'
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

/** A sticker's channels: the cube's as above, the others as painted. */
const rgbOf = (color: Color): readonly number[] =>
  (RGB as Partial<Record<Color, readonly number[]>>)[color] ?? rgbOfHex(COLOR_HEX[color])

/** A face's picture: each sticker a square round its point, on black
 *  plastic, under a warm light (`tint`), with some noise. */
export function facePicture(
  colors: readonly Color[],
  layout: FaceLayout,
  rng: () => number,
  tint = [1.05, 1, 0.85],
): Pixels {
  const scale = Math.max(20, 120 / layout.width)
  const [width, height] = [Math.ceil(layout.width * scale), Math.ceil(layout.height * scale)]
  const data = new Uint8ClampedArray(width * height * 4)
  // Each sticker a square nearly meeting its nearest neighbor's.
  const closest = Math.min(
    ...layout.points.flatMap((p, i) =>
      layout.points.slice(i + 1).map((q) => Math.hypot(p[0] - q[0], p[1] - q[1])),
    ),
  )
  const half = 0.45 * closest * scale
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = layout.points.findIndex(
        ([px, py]) =>
          Math.abs(x + 0.5 - px * scale) < half && Math.abs(y + 0.5 - py * scale) < half,
      )
      const rgb = cell < 0 ? [10, 10, 10] : rgbOf(colors[cell]!)
      const k = (y * width + x) * 4
      for (let c = 0; c < 3; c++) data[k + c] = rgb[c]! * tint[c]! + (rng() - 0.5) * 16
      data[k + 3] = 255
    }
  }
  return { width, height, data }
}

/** A grid face's picture (`facePicture`). */
export const picture = (
  colors: readonly Color[],
  rows: number,
  cols: number,
  rng: () => number,
  tint?: number[],
): Pixels => facePicture(colors, gridLayout(rows, cols), rng, tint)

/** Each face of a state scanned, in the plan's order, held as told. */
export function scanOf(
  shape: CubeShape,
  seed: number,
): { faces: CellSample[][]; edit: EditStickers } {
  const rng = seededRng(seed)
  const plan = scanPlan(shape)
  const solved = solvedCube(shape)
  const scrambled = applyMoves(solved, scrambleTurns(shape, 30, rng, solved))
  // Held as the instructions say, each face's center toward the lens in
  // its turn (a 5x5's middle slices move them).
  const edit = cubeOrientations(scrambled)
    .map(cubeToEdit)
    .find((e) =>
      plan.every((face) => !face.told || e[face.cells[face.center!]!] === face.frontColor),
    )!
  const faces = plan.map((face) =>
    sampleFace(
      facePicture(
        face.cells.map((id) => edit[id]!),
        face,
        rng,
      ),
      face,
    ),
  )
  return { faces, edit }
}
