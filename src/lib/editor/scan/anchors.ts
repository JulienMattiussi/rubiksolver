import { shapeColors, stickersOfColor } from '../../core/cube'
import { cheapestAssignment } from './assign'
import { distance, guessColor, labOf, rgbOfHex, type Lab } from './color'
import { COLOR_HEX } from '../../core/stickerColors'
import { scanPlan } from './plan'
import type { CellSample } from './sample'
import type { Color } from '../../core/types'
import type { CubeShape } from '../../core/shapes'

/**
 * Each color of a scanned puzzle as this light shows it (pure), which the
 * reading measures every sticker against (classify.ts). A first guess:
 * the faces' centers (each its face's color where it tells the face, else
 * the color it looks like); else (an even cube) the stickers by hue. Then the stickers are sorted into
 * the colors among themselves, each color taking as many as the puzzle has
 * (a 4x4, 16; a Megaminx, 11), the nearest to it, and each color moves to
 * where its stickers fell, twice over: the light varies from face to face,
 * a center alone may be off.
 */

/** A color as the puzzle is painted, for a first guess no sticker made. */
const painted = (color: Color): Lab => labOf(...rgbOfHex(COLOR_HEX[color]))

/** Rounds of sorting the stickers, then moving each color where they fell. */
const ROUNDS = 3

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
  const labs = faces.flat().map((s) => s.lab)
  const colors = shapeColors(shape)
  // A first guess: each face's center, where it tells the face (a turn of
  // the face leaves it where it is); else one center a color, wherever it
  // stands (a Skewb's move about), each the color it is nearest to as
  // painted; else each color's stickers by hue, or as painted.
  let anchor = new Map<Color, Lab>()
  const centers = plan.flatMap((face, f) => {
    const center = face.center !== null ? faces[f]?.[face.center] : undefined
    return center ? [{ face, lab: center.lab }] : []
  })
  if (plan[0]?.told) {
    for (const { face, lab } of centers) anchor.set(face.frontColor, lab)
  } else if (centers.length === colors.length) {
    const sorted = cheapestAssignment(
      centers.map(({ lab }) => colors.map((color) => distance(lab, painted(color)))),
    )
    centers.forEach(({ lab }, i) => anchor.set(colors[sorted[i]!]!, lab))
  } else {
    // Hue tells a cube's six colors only (a Holey Megaminx's twelve start
    // from their painted tones).
    const named = plan[0]?.named
    for (const color of colors) {
      const guessed = named ? labs.filter((lab) => guessColor(lab).color === color) : []
      anchor.set(color, guessed.length ? mean(guessed) : painted(color))
    }
  }
  const places = colors.flatMap((color) => Array<Color>(stickersOfColor(shape, color)).fill(color))
  if (places.length !== labs.length || anchor.size !== colors.length) return anchor
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
