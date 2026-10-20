import { FACE_COLOR, solvedCube } from '../../core/cube'
import { FACE_NORMAL, layerCoords } from '../../core/geometry'
import { hasColors } from '../../core/pieces'
import { SHAPE_DIMS } from '../../core/shapes'
import type { Cube, Cubie, Face, Vec3 } from '../../core/types'
import type { Projection } from '../../teach/project'

/**
 * A reduced big cube (a 4x4, a 5x5) read as a 3x3, its pieces kept by what
 * they are (the 3x3 tutorial follows pieces from state to state): each 3x3
 * piece is the big piece of its colors (a corner), the pieces of its two
 * colors along an edge (all showing the same once paired), or its color's
 * face (a center, all of them on it). A big place belongs to the 3x3 place
 * its layers make (an outer layer to the outer one, the inner ones to the
 * middle). The middle piece of an odd cube comes first, where it stands:
 * the 3x3 piece's own.
 */

const SOLVED_3 = solvedCube('3')

const colorsOf = (c: Cubie) => c.stickers.map((s) => s.color)
const zeros = (c: Cubie) => c.position.filter((v) => v === 0).length
/** A 3x3 piece's big pieces: those of its colors and kind, the middle one
 *  first. */
const piecesLike = (cube: Cube, piece: Cubie) =>
  cube
    .flatMap((c, i) =>
      c.stickers.length === piece.stickers.length &&
      piece.stickers.length > 0 &&
      hasColors(c, colorsOf(piece))
        ? [i]
        : [],
    )
    .sort((a, b) => zeros(cube[b]!) - zeros(cube[a]!))

/** The face a color is on, once the centers are solved (yellow down). */
const faceOfColor = (color: string) =>
  (Object.keys(FACE_COLOR) as Face[]).find((f) => FACE_COLOR[f] === color)!

/** The projection of a reduced cube of `layers` layers a side. */
function reducedProjection(layers: number): Projection {
  const coords = layerCoords(layers)
  const outer = coords[coords.length - 1]!
  // The middle coordinate first (an odd cube's middle piece's).
  const inner = coords.slice(1, -1).sort((a, b) => Math.abs(a) - Math.abs(b))
  /** A big coordinate as a 3x3's: the outer layers stay, the inner ones meet. */
  const downCoord = (x: number) => (Math.abs(x) === outer ? Math.sign(x) : 0)
  const downSlot = (p: Vec3): Vec3 => [downCoord(p[0]), downCoord(p[1]), downCoord(p[2])]
  /** A 3x3 coordinate's big ones. */
  const upCoords = (x: number) => (x === 0 ? inner : [outer * x])
  return {
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
      upCoords(x).flatMap((a) =>
        upCoords(y).flatMap((b) => upCoords(z).map((c): Vec3 => [a, b, c])),
      ),
    downSlot,
  }
}

export const PROJECT_4 = reducedProjection(SHAPE_DIMS['4'][0])
export const PROJECT_5 = reducedProjection(SHAPE_DIMS['5'][0])
