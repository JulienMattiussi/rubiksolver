import { FACE_COLOR, solvedCube } from '../../core/cube'
import { FACE_NORMAL } from '../../core/geometry'
import { hasColors } from '../../core/pieces'
import type { Cube, Cubie, Face, Vec3 } from '../../core/types'
import type { Projection } from '../../teach/project'

/**
 * A reduced 4x4 read as a 3x3, its pieces kept by what they are (the 3x3
 * tutorial follows pieces from state to state): each 3x3 piece is the 4x4
 * piece of its colors (a corner), a wing of its two colors (an edge, both
 * wings showing the same once paired), or its color's face (a center, the
 * four of them on it). A 4x4 place belongs to the 3x3 place its layers make
 * (an outer layer to the outer one, the two inner ones to the middle).
 */

const SOLVED_3 = solvedCube('3')

const colorsOf = (c: Cubie) => c.stickers.map((s) => s.color)
/** A 3x3 piece's 4x4 pieces: those of its colors and kind. */
const piecesLike = (cube: Cube, piece: Cubie) =>
  cube.flatMap((c, i) =>
    c.stickers.length === piece.stickers.length &&
    piece.stickers.length > 0 &&
    hasColors(c, colorsOf(piece))
      ? [i]
      : [],
  )

/** A 4x4 coordinate as a 3x3's: the outer layers stay, the inner ones meet. */
const downCoord = (x: number) => (Math.abs(x) === 3 ? Math.sign(x) : 0)
const downSlot = (p: Vec3): Vec3 => [downCoord(p[0]), downCoord(p[1]), downCoord(p[2])]

/** A 3x3 coordinate's 4x4 ones. */
const upCoords = (x: number) => (x === 0 ? [-1, 1] : [3 * x])

/** The face a color is on, once the centers are solved (yellow down). */
const faceOfColor = (color: string) =>
  (Object.keys(FACE_COLOR) as Face[]).find((f) => FACE_COLOR[f] === color)!

export const PROJECT_4: Projection = {
  project: (cube) =>
    SOLVED_3.map((piece): Cubie => {
      if (piece.stickers.length === 0) return piece
      if (piece.stickers.length === 1) {
        // A center: its face, its color.
        const normal = FACE_NORMAL[faceOfColor(piece.stickers[0]!.color)]
        return { position: normal, stickers: [{ normal, color: piece.stickers[0]!.color }] }
      }
      const source = cube[piecesLike(cube, piece)[0]!]!
      return { position: downSlot(source.position), stickers: source.stickers }
    }),
  up: (cube, piece) => piecesLike(cube, SOLVED_3[piece]!),
  down: (cube, piece) => {
    const colors = colorsOf(cube[piece]!)
    return SOLVED_3.findIndex(
      (c) => c.stickers.length === colors.length && colors.length > 0 && hasColors(c, colors),
    )
  },
  upSlots: ([x, y, z]) =>
    upCoords(x).flatMap((a) => upCoords(y).flatMap((b) => upCoords(z).map((c): Vec3 => [a, b, c]))),
  downSlot,
}
