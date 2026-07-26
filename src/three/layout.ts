import { layerCoords } from '@/lib/cube'
import type { Dims, Vec3 } from '@/lib/types'

/**
 * Visual layout of a puzzle. Logical coordinates are spaced by their own axis
 * (see `layerCoords`), so the renderer maps each one to its layer index: every
 * cubie then occupies exactly one unit cell whatever the shape, and the whole
 * puzzle is scaled so its longest side always spans the same 3 world units.
 */

/** Uniform scale applied to the whole puzzle group. */
export function cubeScale(dims: Dims): number {
  return 3 / Math.max(...dims)
}

/** Map a logical cubie/slot position to its visual position (unit cells). */
export function visualPosition(p: Vec3, dims: Dims): [number, number, number] {
  return [0, 1, 2].map((a) => {
    const coords = layerCoords(dims[a]!)
    return coords.indexOf(p[a]!) - (coords.length - 1) / 2
  }) as [number, number, number]
}

/** Gap between two neighboring cubies, so the pieces read as separate blocks. */
export const CUBIE_GAP = 0.04
