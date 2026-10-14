import { FACE_COLOR } from '@/lib/core/cube'
import { FACE_NORMAL, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Face } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Quarter Cube's pieces (lib/puzzles/twisted/quarter.ts): a 3x3's cubies,
 * each center wearing its face's stop, as on the real puzzle: a round
 * recess, a quarter-circle groove in it that turns with the face, and a
 * fixed pin in the groove, at one end of it. The face turns as far as the
 * groove lets the pin go: a quarter, then back. The pins belong to the
 * hidden core, which never turns, so they stay put while a face turns.
 */

const SHRINK = 0.97
const STICKER_SCALE = 0.86
/** Where the pin stands on each face (degrees, counter-clockwise seen
 *  from outside), and the groove's and the recess's radii. */
const PIN = 90
const GROOVE: [number, number] = [0.15, 0.23]
const RECESS: [number, number] = [0.25, 0.28]

/** A point of the face of normal `n` through `center`, at (u, v) across it
 *  (counter-clockwise seen from outside), lifted off it. */
function onFace(center: readonly number[], n: readonly number[], lift: number) {
  const a = n.findIndex((v) => v !== 0)
  const [b, c] = [(a + 1) % 3, (a + 2) % 3]
  return (u: number, v: number): P3 => {
    const p: number[] = [...center]
    p[a] = center[a]! + n[a]! * (0.5 + lift)
    p[b] = center[b]! + u
    p[c] = center[c]! + v * n[a]!
    return p as P3
  }
}

/** A band of a ring between two radii, from one angle to another (degrees,
 *  counter-clockwise seen from outside). */
function arc(
  point: (u: number, v: number) => P3,
  normal: P3,
  [r1, r2]: readonly [number, number],
  from: number,
  to: number,
  paint: PiecePolygon['paint'] = 'body',
): PiecePolygon[] {
  const steps = Math.max(2, Math.round(Math.abs(to - from) / 8))
  return Array.from({ length: steps }, (_, i) => {
    const [t0, t1] = [i, i + 1].map((k) => ((from + ((to - from) * k) / steps) * Math.PI) / 180)
    const quad = [
      point(r1 * Math.cos(t0!), r1 * Math.sin(t0!)),
      point(r2 * Math.cos(t0!), r2 * Math.sin(t0!)),
      point(r2 * Math.cos(t1!), r2 * Math.sin(t1!)),
      point(r1 * Math.cos(t1!), r1 * Math.sin(t1!)),
    ]
    return { points: to > from ? quad : quad.reverse(), paint, normal }
  })
}

/** A center's recess and groove: the groove from the pin the way the face
 *  can turn (clockwise from START, spin 0: the groove lies the other way
 *  from the pin; a quarter on, back). */
function mark(cubie: Cubie): PiecePolygon[] {
  const n = cubie.stickers[0]!.normal
  const point = onFace(cubie.position, n, 0.006)
  const normal = [...n] as P3
  const from = cubie.spin === 1 ? PIN - 90 : PIN
  return [...arc(point, normal, RECESS, 0, 360), ...arc(point, normal, GROOVE, from, from + 90)]
}

/** The six pins, on the core: still while the faces turn. */
function pins(): PiecePolygon[] {
  return (Object.keys(FACE_NORMAL) as Face[]).flatMap((f) => {
    const n = FACE_NORMAL[f]
    const point = onFace(n, n, 0.012)
    const r = (GROOVE[0] + GROOVE[1]) / 2
    const at = (PIN * Math.PI) / 180
    const middle = point(r * Math.cos(at), r * Math.sin(at))
    const size = 0.055
    const disc = onFace(
      [0, 1, 2].map((d) => middle[d]! - n[d]! * (0.5 + 0.012)),
      n,
      0.012,
    )
    // Its face's color, ringed in black to stand out from it.
    const ring = arc(disc, [...n] as P3, [size, size + 0.02], 0, 360)
    return [...ring, ...arc(disc, [...n] as P3, [0, size], 0, 360, FACE_COLOR[f])]
  })
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
  if (cubie.stickers.length === 0) return pins()
  return cubie.stickers.length === 1 ? [...faces, ...mark(cubie)] : faces
}
