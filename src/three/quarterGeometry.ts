import { FACE_NORMAL, normalIndex } from '@/lib/geometry'
import type { Cubie, Face } from '@/lib/types'
import { face, type P3, type PiecePolygon } from './polygons'

/**
 * Geometry of the Quarter Cube's pieces (lib/quarter.ts): a 3x3's cubies,
 * each center wearing its face's mark, as on fan2cube's drawings: a ring
 * open where it points, and a thick quarter of it, the way its face can
 * turn.
 */

const SHRINK = 0.97
const STICKER_SCALE = 0.86

/** A center's mark: which way its face can turn. */
function mark(cubie: Cubie): PiecePolygon[] {
  const n = cubie.stickers[0]!.normal
  const a = n.findIndex((v) => v !== 0)
  const [b, c] = [(a + 1) % 3, (a + 2) % 3]
  const point = (u: number, v: number): P3 => {
    const p: number[] = [...cubie.position]
    p[a] = cubie.position[a]! + n[a]! * 0.5 + n[a]! * 0.006
    p[b] = cubie.position[b]! + u
    p[c] = cubie.position[c]! + v * n[a]!
    return p as P3
  }
  const normal = [...n] as P3
  /** A band of the ring between two radii, from one angle to another
   *  (degrees, counter-clockwise seen from outside the face). */
  const arc = (r1: number, r2: number, from: number, to: number): PiecePolygon[] => {
    const steps = Math.max(2, Math.round(Math.abs(to - from) / 8))
    return Array.from({ length: steps }, (_, i) => {
      const [t0, t1] = [i, i + 1].map((k) => ((from + ((to - from) * k) / steps) * Math.PI) / 180)
      const quad = [
        point(r1 * Math.cos(t0!), r1 * Math.sin(t0!)),
        point(r2 * Math.cos(t0!), r2 * Math.sin(t0!)),
        point(r2 * Math.cos(t1!), r2 * Math.sin(t1!)),
        point(r1 * Math.cos(t1!), r1 * Math.sin(t1!)),
      ]
      return { points: to > from ? quad : quad.reverse(), paint: 'body', normal }
    })
  }
  // The ring, open where the face's mark points (it turns with the face),
  // and a thick quarter from there the way the face can go: clockwise
  // (spin 0), or back (spin 1). The thick quarter stays where it is when
  // the face turns: the mark only goes from one end of it to the other.
  const way = cubie.spin === 1 ? 1 : -1
  return [...arc(0.2, 0.235, 105, 435), ...arc(0.16, 0.27, 90, 90 + way * 90)]
}

/** Every polygon of a piece, as it stands. */
export function quarterPolygons(cubie: Cubie): PiecePolygon[] {
  const h = 0.5 * SHRINK
  const faces = (Object.keys(FACE_NORMAL) as Face[]).flatMap((f) => {
    const n = FACE_NORMAL[f]
    const a = n.findIndex((v) => v !== 0)
    const [b, c] = [(a + 1) % 3, (a + 2) % 3]
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([u, v]) => {
      const p: number[] = [...cubie.position]
      p[a] = p[a]! + n[a]! * h
      p[b] = p[b]! + u! * h
      p[c] = p[c]! + v! * h * n[a]!
      return p as P3
    })
    return face(corners, [...n] as P3, cubie, normalIndex(n), STICKER_SCALE)
  })
  return cubie.stickers.length === 1 ? [...faces, ...mark(cubie)] : faces
}
