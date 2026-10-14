import { normalIndex } from '@/lib/geometry'
import { MEGA_AXES, MEGA_FACES, megaFaceOf, megaSlotAt } from '@/lib/megaminx'
import type { Cubie, MegaFace, Vec3 } from '@/lib/types'
import { polyhedron, type Plane } from './polyhedron'
import { face, type P3, type PiecePolygon } from './polygons'

/**
 * Geometry of the Megaminx's pieces (lib/megaminx.ts): a dodecahedron of
 * inradius 1, each face's layer cut off by a plane parallel to it. A slot
 * is what lies inside the layers of its faces and outside the others': a
 * small pentagon in the middle of each face (the center), a trapezoid along
 * each edge, a kite at each corner. Pieces are drawn where they stand, each
 * face of the dodecahedron colored by the piece's sticker on it.
 */

/** How far a layer's cut lies along its face's axis (the face at 1). */
const CUT = 0.66
const SHRINK = 0.97
const STICKER_SCALE = 0.86
/** The scene's size: as wide as a 3x3. */
const SCALE = 1.35

const SLOT_FACES = new Map<string, { corners: P3[]; normal: Vec3 }[]>()

/** A slot's share of the dodecahedron, in its own place. */
function slotFaces(slot: readonly MegaFace[]) {
  const key = slot.join()
  let faces = SLOT_FACES.get(key)
  if (faces) return faces
  const planes: Plane[] = MEGA_FACES.flatMap((f): Plane[] => {
    const n = MEGA_AXES[f] as unknown as Vec3
    const within: Plane = { normal: n, offset: 1 }
    const minus = n.map((v) => -v) as unknown as Vec3
    return [within, slot.includes(f) ? { normal: minus, offset: -CUT } : { normal: n, offset: CUT }]
  })
  faces = polyhedron(planes)
  SLOT_FACES.set(key, faces)
  return faces
}

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a piece, where it stands (`outside`: its colors only,
 *  for the flat thumbnail, which draws in depth order). */
function piecePolygons(cubie: Cubie, outside: boolean): PiecePolygon[] {
  if (cubie.stickers.length === 0) return []
  const id = cubie.position.join() + cubie.stickers.map((s) => s.normal.join() + s.color).join('|')
  const key = id + (outside ? 'o' : '')
  const known = SHAPES.get(key)
  if (known) return known
  const slot = megaSlotAt(cubie.position)
  const faces = slotFaces(slot)
  const all = faces.flatMap((f) => f.corners)
  const middle = [0, 1, 2].map((d) => all.reduce((s, p) => s + p[d]!, 0) / all.length)
  const toScene = (p: P3): P3 =>
    p.map((v, d) => (middle[d]! + (v - middle[d]!) * SHRINK) * SCALE) as P3
  const polygons = faces.flatMap(({ corners, normal }) => {
    // On the dodecahedron's own face: the piece's sticker facing it.
    const on = MEGA_FACES.find(
      (f) => MEGA_AXES[f].every((v, d) => Math.abs(v - normal[d]!) < 1e-9) && slot.includes(f),
    )
    const sticker = on && cubie.stickers.find((s) => megaFaceOf(s.normal) === on)
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

export const megaPolygons = (cubie: Cubie) => piecePolygons(cubie, false)
export const megaThumbnail = (cubie: Cubie) => piecePolygons(cubie, true)
