import { shapeColors, stickersOfColor } from '../../core/cube'
import { cheapestAssignment } from './assign'
import { distance, guessColor, labOf, type Lab } from './color'
import { hasCenters, scanPlan } from './plan'
import type { CellSample } from './sample'
import type { Color } from '../../core/types'
import type { CubeShape } from '../../core/shapes'

/**
 * Each color of a scanned puzzle as this light shows it (pure), which the
 * reading measures every sticker against (classify.ts). Where every face
 * has a center, the face asked for, its center tells it. An even cube has
 * none: its stickers are sorted into its colors among themselves, each
 * color taking as many as the puzzle has (a 4x4, 16), the nearest to it,
 * twice over (a first guess by hue, then each color where its stickers
 * fell).
 */

/** A color as a camera often shows it, for a first guess no sticker made. */
const TYPICAL: Partial<Record<Color, Lab>> = {
  W: labOf(235, 235, 235),
  Y: labOf(250, 210, 30),
  G: labOf(0, 160, 80),
  B: labOf(0, 90, 200),
  O: labOf(250, 120, 40),
  R: labOf(190, 20, 50),
}

const GREY: Lab = [50, 0, 0]

/** Rounds of sorting the stickers, then moving each color where its fell. */
const ROUNDS = 2

const mean = (labs: readonly Lab[]): Lab => {
  const of = (c: 0 | 1 | 2) => labs.reduce((sum, l) => sum + l[c], 0) / labs.length
  return [of(0), of(1), of(2)]
}

/** Each color as the scan shows it, from each face's cells as taken. */
export function anchorsOf(
  shape: CubeShape,
  faces: readonly (readonly CellSample[])[],
): Map<Color, Lab> {
  const plan = scanPlan(shape)
  if (hasCenters(shape)) {
    // A turn of the face leaves its center where it is.
    const anchor = new Map<Color, Lab>()
    plan.forEach((face, f) => {
      const center = face.center !== null && faces[f]?.[face.center]
      if (center) anchor.set(face.frontColor, center.lab)
    })
    return anchor
  }
  const labs = faces.flat().map((s) => s.lab)
  const colors = shapeColors(shape)
  let anchor = new Map(
    colors.map((color) => {
      const guessed = labs.filter((lab) => guessColor(lab).color === color)
      return [color, guessed.length ? mean(guessed) : (TYPICAL[color] ?? GREY)] as const
    }),
  )
  const places = colors.flatMap((color) => Array<Color>(stickersOfColor(shape, color)).fill(color))
  if (places.length !== labs.length) return anchor
  for (let round = 0; round < ROUNDS; round++) {
    const sorted = cheapestAssignment(
      labs.map((lab) => places.map((color) => distance(lab, anchor.get(color)!))),
    )
    anchor = new Map(
      colors.map(
        (color) => [color, mean(labs.filter((_, i) => places[sorted[i]!] === color))] as const,
      ),
    )
  }
  return anchor
}
