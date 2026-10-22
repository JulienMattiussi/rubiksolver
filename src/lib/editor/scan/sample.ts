import { colored, labOf, type Lab } from './color'
import type { FaceLayout } from './plan'

/**
 * A face's cells measured on a picture (pure): the picture is the frame
 * the user aims the face into; each cell is read round its point (plan.ts),
 * as the median of its pixels. A glare takes color away, never gives any: when
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

const median = (values: number[]) => {
  values.sort((a, b) => a - b)
  return values[values.length >> 1]!
}

const medianLab = (labs: readonly Lab[]): Lab => [
  median(labs.map((v) => v[0])),
  median(labs.map((v) => v[1])),
  median(labs.map((v) => v[2])),
]

const clamp = (v: number, size: number) => Math.min(size - 1, Math.max(0, v))

/** A face's cells measured on the picture of its frame, in its layout's
 *  order. */
export function sampleFace(pixels: Pixels, layout: FaceLayout): CellSample[] {
  const scale = pixels.width / layout.width
  const reach = layout.reach * scale
  return layout.points.map(([px, py]) => {
    const labs: Lab[] = []
    for (let i = 0; i < READS; i++) {
      for (let j = 0; j < READS; j++) {
        // Within the picture, whatever the layout says.
        const x = clamp(
          Math.floor(px * scale - reach + (2 * reach * (j + 0.5)) / READS),
          pixels.width,
        )
        const y = clamp(
          Math.floor(py * scale - reach + (2 * reach * (i + 0.5)) / READS),
          pixels.height,
        )
        const k = (y * pixels.width + x) * 4
        labs.push(labOf(pixels.data[k]!, pixels.data[k + 1]!, pixels.data[k + 2]!))
      }
    }
    const tinted = labs.filter(colored)
    if (tinted.length < COLORED * labs.length) return { lab: medianLab(labs) }
    tinted.sort((p, q) => Math.hypot(q[1], q[2]) - Math.hypot(p[1], p[2]))
    return { lab: medianLab(tinted.slice(0, Math.ceil(tinted.length / 2))) }
  })
}

/** Several pictures of one face merged, cell by cell (the steady seconds
 *  before the capture): the median of each. */
export function mergeSamples(frames: readonly (readonly CellSample[])[]): CellSample[] {
  return frames[0]!.map((_, cell) => ({ lab: medianLab(frames.map((f) => f[cell]!.lab)) }))
}
