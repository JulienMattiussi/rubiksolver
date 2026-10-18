import type { PiecePolygon } from './polygons'

type V3 = readonly [number, number, number]

/** A puzzle's outside, as the planes of its faces: each an outward normal
 *  and how far out it lies. A point is off the puzzle when it lies beyond
 *  one of them (the tutorial's arrow keeps clear of it). */
export type Hull = readonly { readonly normal: V3; readonly offset: number }[]

/** A box's hull, from half its sides (a grid puzzle's, in cells). */
export const boxHull = ([x, y, z]: V3): Hull => [
  { normal: [1, 0, 0], offset: x },
  { normal: [-1, 0, 0], offset: x },
  { normal: [0, 1, 0], offset: y },
  { normal: [0, -1, 0], offset: y },
  { normal: [0, 0, 1], offset: z },
  { normal: [0, 0, -1], offset: z },
]

/** The hull of a puzzle drawn in polygons: each direction its stickers
 *  face, as far out as they lie. */
export function polygonsHull(polygons: readonly PiecePolygon[]): Hull {
  const planes = new Map<string, { normal: V3; offset: number }>()
  for (const { paint, normal, points } of polygons) {
    if (paint === 'body') continue
    const key = normal.map((n) => n.toFixed(2)).join()
    const offset = Math.max(
      ...points.map((p) => p[0]! * normal[0] + p[1]! * normal[1] + p[2]! * normal[2]),
    )
    const plane = planes.get(key)
    if (!plane || offset > plane.offset)
      planes.set(key, { normal: [normal[0], normal[1], normal[2]], offset })
  }
  return [...planes.values()]
}
