import { AXIS_ROTATIONS, normalIndex } from '@/lib/geometry'
import { colorsOf } from '@/lib/pieces'
import type { Color, Cube, Cubie, Vec3 } from '@/lib/types'
import { dot, polyhedron, type Plane } from './polyhedron'
import { face, type P3, type PiecePolygon } from './polygons'

/**
 * Pieces of a 3x3 shape mod cut out of a convex solid (the Barrel, the
 * Fisher Cube): each piece is its solved cell of the 3x3's mechanism (the
 * outer layers open outwards) cut by the solid's planes, then carried as
 * the piece stands (the turn from its solved place, read on its stickers).
 * A face on the cube's own outside shows the piece's sticker there; a face
 * on one of the solid's other planes its own color (`cutColor`).
 */

const SHRINK = 0.97
const STICKER_SCALE = 0.84
/** Far enough to stand for the open side of an outer cell. */
const FAR = 10

export interface CutSolid {
  readonly planes: readonly Plane[]
  /** The color of the solid's face of this normal, if it is not a cube's. */
  readonly cutColor: (normal: Vec3) => Color | undefined
  /** Model units to scene units, when the solid reaches farther than a
   *  3x3 (1 otherwise). */
  readonly scale?: number
}

/** The whole-puzzle turn taking a piece from its solved place to where it
 *  stands (any that does, for a piece that looks the same either way). */
function turnOf(cubie: Cubie, home: Cubie): (v: Vec3) => Vec3 {
  // Sticker by sticker (turns keep their order; a Windmill's two marks
  // share a color).
  return AXIS_ROTATIONS.find(
    (turn) =>
      turn(home.position).join() === cubie.position.join() &&
      home.stickers.every((s, k) => turn(s.normal).join() === cubie.stickers[k]!.normal.join()),
  )!
}

/** A cell's share of the solid, in its solved frame. */
function cellFaces(cell: Vec3, solid: CutSolid) {
  const planes: Plane[] = [...solid.planes]
  for (let a = 0; a < 3; a++) {
    for (const sign of [1, -1]) {
      const normal = [0, 0, 0] as unknown as [number, number, number]
      normal[a] = sign
      // Open outwards on an outer layer, the solid closes it.
      const offset = cell[a]! * sign === 1 ? FAR : sign * cell[a]! + 0.5
      planes.push({ normal, offset })
    }
  }
  return polyhedron(planes)
}

/** The polygons of a solid's pieces, for the 3D view and the thumbnail
 *  (`outside`: its colors only, the flat picture drawing in depth order). */
export function cutSolidPolygons(solid: CutSolid, solved: Cube) {
  const homes = new Map(solved.map((c) => [colorsOf(c), c]))
  const shapes = new Map<string, PiecePolygon[]>()
  return (cubie: Cubie, outside: boolean): PiecePolygon[] => {
    if (cubie.stickers.length === 0) return [] // the core never shows
    const id = cubie.stickers.map((s) => s.normal.join() + s.color).join('|') + (outside ? 'o' : '')
    const known = shapes.get(id)
    if (known) return known
    const home = homes.get(colorsOf(cubie))!
    const turn = turnOf(cubie, home)
    const faces = cellFaces(home.position, solid)
    const all = faces.flatMap((f) => f.corners)
    const middle = [0, 1, 2].map((d) => all.reduce((s, p) => s + p[d]!, 0) / all.length)
    const carry = (p: readonly number[]): P3 =>
      turn(
        p.map(
          (v, d) => (middle[d]! + (v - middle[d]!) * SHRINK) * (solid.scale ?? 1),
        ) as unknown as Vec3,
      ) as unknown as P3
    const polygons = faces.flatMap(({ corners, normal }) => {
      const points = corners.map(carry)
      const length = Math.hypot(...normal)
      const n = turn(normal).map((v) => v / length) as unknown as P3
      const color = solid.cutColor(normal)
      let polys: PiecePolygon[]
      if (color) {
        // Its own color, answering clicks (entry) as the piece's sticker
        // nearest to it.
        const near = home.stickers.reduce((m, s) =>
          dot(s.normal, normal) > dot(m.normal, normal) ? s : m,
        )
        const shown = { normal: turn(near.normal), color }
        polys = face(
          points,
          n,
          { position: cubie.position, stickers: [shown] },
          normalIndex(shown.normal),
          STICKER_SCALE,
        )
      } else {
        // On the outside (not a cut between pieces), with a sticker there.
        const out = dot(normal, corners[0]!) > 0.5 + 1e-6
        const sticker = out && home.stickers.some((s) => s.normal.join() === normal.join())
        polys = face(
          points,
          n,
          cubie,
          sticker ? normalIndex(turn(normal)) : undefined,
          STICKER_SCALE,
        )
      }
      return outside ? polys.filter((p) => p.paint !== 'body') : polys
    })
    shapes.set(id, polygons)
    return polygons
  }
}
