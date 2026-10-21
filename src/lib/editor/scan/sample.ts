import { labOf, type Lab } from './color'

/**
 * A face's cells measured on a picture (pure): the picture is the frame
 * the user aims the face into, cut into its grid; each cell is read on its
 * middle (its borders may hold the plastic between stickers, or the
 * next sticker when the cube is not exactly the frame's size), as the
 * median of its pixels (a glare, a few pixels, does not tip it).
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
      out.push({ lab: medianLab(labs) })
    }
  }
  return out
}

/** Several pictures of one face merged, cell by cell (the steady seconds
 *  before the capture): the median of each. */
export function mergeSamples(frames: readonly (readonly CellSample[])[]): CellSample[] {
  return frames[0]!.map((_, cell) => ({ lab: medianLab(frames.map((f) => f[cell]!.lab)) }))
}
