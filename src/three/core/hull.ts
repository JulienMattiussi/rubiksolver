import { cubieBox } from '@/lib/core/shape'
import type { Cube, CubeColor, Cubie, Dims } from '@/lib/core/types'
import { visualPosition } from './layout'
import type { PiecePolygon } from './polygons'

type V3 = readonly [number, number, number]

/** A puzzle's outside, as the planes of its faces: each an outward normal
 *  and how far out it lies. A point is off the puzzle when it lies beyond
 *  one of them (the tutorial's arrow keeps clear of it). */
export type Hull = readonly { readonly normal: V3; readonly offset: number }[]

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

/** The hull of a grid puzzle's pieces as drawn, their boxes' own sizes
 *  (a mirror cube's, bumps and all), in cells: each side as far out as a
 *  piece reaches. */
export function cubiesHull(cube: Cube, dims: Dims, thickness: Record<CubeColor, number>): Hull {
  const far = [0, 0, 0, 0, 0, 0]
  for (const cubie of cube) {
    const cell = visualPosition(cubie.position, dims)
    const { size, center } = cubieBox(cubie.stickers, thickness)
    for (const a of [0, 1, 2] as const) {
      const mid = cell[a] + center[a]!
      far[2 * a] = Math.max(far[2 * a]!, mid + size[a]! / 2)
      far[2 * a + 1] = Math.max(far[2 * a + 1]!, -(mid - size[a]! / 2))
    }
  }
  return [0, 1, 2].flatMap((a) =>
    [1, -1].map((sign, s) => ({
      normal: [0, 1, 2].map((b) => (b === a ? sign : 0)) as unknown as V3,
      offset: far[2 * a + s]!,
    })),
  )
}

/** Where a piece's face stands (its outward normal's side of its box, as
 *  drawn: a mirror cube's sizes), in cells: the middle of its sticker. */
export function faceCenter(
  cubie: Cubie,
  normal: V3,
  dims: Dims,
  thickness: Record<CubeColor, number>,
): [number, number, number] {
  const cell = visualPosition(cubie.position, dims)
  const { size, center } = cubieBox(cubie.stickers, thickness)
  return [0, 1, 2].map((a) => cell[a]! + center[a]! + (normal[a]! * size[a]!) / 2) as [
    number,
    number,
    number,
  ]
}
