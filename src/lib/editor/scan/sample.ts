import { colored, labOf, type Lab } from './color'

/**
 * A face's cells measured on a picture (pure): the picture is the frame
 * the user aims the face into, cut into its grid; each cell is read on its
 * middle (its borders may hold the plastic between stickers, or the
 * next sticker when the cube is not exactly the frame's size), as the
 * median of its pixels. A glare takes color away, never gives any: when
 * a good share of a cell's pixels have some color, the cell is read on
 * the most colored half of those (the glare spared them), so a sticker
 * half under a glare keeps its color.
 */

/** RGBA pixels, row by row (an ImageData). */
export interface Pixels {
  readonly width: number
  readonly height: number
  readonly data: ArrayLike<number>
}

export interface CellSample {
  readonly lab: Lab
}

/** The share of a cell's pixels with some color that tells a colored
 *  sticker, however much glare covers the rest. */
const COLORED = 0.25

/** Pixels read per cell side, at most: enough for a median. */
const READS = 12
/** The share of a cell's side read, in its middle. */
const MIDDLE = 0.4
const MARGIN = (1 - MIDDLE) / 2

const median = (values: number[]) => {
  values.sort((a, b) => a - b)
  return values[values.length >> 1]!
}

const medianLab = (labs: readonly Lab[]): Lab => [
  median(labs.map((v) => v[0])),
  median(labs.map((v) => v[1])),
  median(labs.map((v) => v[2])),
]

/** A grid's cells measured, row by row from the top left. */
export function sampleGrid(pixels: Pixels, rows: number, cols: number): CellSample[] {
  const cellW = pixels.width / cols
  const cellH = pixels.height / rows
  const out: CellSample[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const labs: Lab[] = []
      for (let i = 0; i < READS; i++) {
        for (let j = 0; j < READS; j++) {
          const x = Math.floor((col + MARGIN + (MIDDLE * (j + 0.5)) / READS) * cellW)
          const y = Math.floor((row + MARGIN + (MIDDLE * (i + 0.5)) / READS) * cellH)
          const k = (y * pixels.width + x) * 4
          labs.push(labOf(pixels.data[k]!, pixels.data[k + 1]!, pixels.data[k + 2]!))
        }
      }
      const tinted = labs.filter(colored)
      if (tinted.length < COLORED * labs.length) {
        out.push({ lab: medianLab(labs) })
        continue
      }
      tinted.sort((p, q) => Math.hypot(q[1], q[2]) - Math.hypot(p[1], p[2]))
      out.push({ lab: medianLab(tinted.slice(0, Math.ceil(tinted.length / 2))) })
    }
  }
  return out
}

/** Several pictures of one face merged, cell by cell (the steady seconds
 *  before the capture): the median of each. */
export function mergeSamples(frames: readonly (readonly CellSample[])[]): CellSample[] {
  return frames[0]!.map((_, cell) => ({ lab: medianLab(frames.map((f) => f[cell]!.lab)) }))
}
