import { DODECA_NORMALS, dot, mapVec, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { polyhedron, type Plane } from '../../core/polyhedron'
import { face, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Skewb Ultimate's pieces (lib/puzzles/shared/rainbow.ts): a dodecahedron
 * of inradius 1 (its faces' normals the model's, 2 read as phi) cut by the
 * Skewb's four planes through its middle, one across each diagonal of the
 * cube. A piece is the part on its side of each plane, drawn where it
 * stands, each face colored by the piece's sticker on it.
 */

const PHI = (1 + Math.sqrt(5)) / 2
const SHRINK = 0.97
const STICKER_SCALE = 0.86
const SCALE = 1.45
const DIAGONALS: readonly Vec3[] = [
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [-1, 1, 1],
]

/** A face's real outward direction (the drawing's `direction`). */
export const real = (n: Vec3): P3 => {
  const v = n.map((x) => (Math.abs(x) === 2 ? Math.sign(x) * PHI : x))
  const length = Math.hypot(...v)
  return v.map((x) => x / length) as P3
}

const SLOTS = new Map<string, { corners: P3[]; normal: Vec3 }[]>()

/** The part of the dodecahedron a slot holds. */
function slotFaces(position: Vec3) {
  const key = position.join()
  let faces = SLOTS.get(key)
  if (faces) return faces
  const planes: Plane[] = [
    ...DODECA_NORMALS.map((n) => ({ normal: real(n) as unknown as Vec3, offset: 1 })),
    ...DIAGONALS.map((d) => {
      const s = Math.sign(dot(d, position))
      return { normal: mapVec(d, (x) => -s * x), offset: 0 }
    }),
  ]
  faces = polyhedron(planes)
  SLOTS.set(key, faces)
  return faces
}

const SHAPES = new Map<string, PiecePolygon[]>()

function piecePolygons(cubie: Cubie, outside: boolean): PiecePolygon[] {
  const key =
    cubie.position.join() +
    cubie.stickers.map((s) => s.normal.join() + s.color).join('|') +
    (outside ? 'o' : '')
  const known = SHAPES.get(key)
  if (known) return known
  const faces = slotFaces(cubie.position)
  const all = faces.flatMap((f) => f.corners)
  const middle = [0, 1, 2].map((d) => all.reduce((s, p) => s + p[d]!, 0) / all.length)
  const toScene = (p: P3): P3 =>
    p.map((v, d) => (middle[d]! + (v - middle[d]!) * SHRINK) * SCALE) as P3
  const polygons = faces.flatMap(({ corners, normal }) => {
    // On a face of the dodecahedron: the piece's sticker there.
    const label = DODECA_NORMALS.find((n) =>
      real(n).every((v, d) => Math.abs(v - normal[d]!) < 1e-9),
    )
    const sticker = label && cubie.stickers.find((s) => s.normal.join() === label.join())
    const polys = face(
      corners.map(toScene),
      [...normal] as P3,
      cubie,
      sticker ? normalIndex(sticker.normal) : undefined,
      STICKER_SCALE,
    )
    return outside ? polys.filter((p) => p.paint !== 'body') : polys
  })
  SHAPES.set(key, polygons)
  return polygons
}

export const skewbUPolygons = (cubie: Cubie) => piecePolygons(cubie, false)
export const skewbUThumbnail = (cubie: Cubie) => piecePolygons(cubie, true)
