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

/**
 * Map a logical cubie/slot position to its visual position (unit cells).
 * Logical grids are centered on 0 and step by 1 (odd layer counts) or by 2
 * (even ones), so dividing by the step gives the cell. Being linear, this
 * also places a piece a shape-shifting turn pushed out of the box (a tower
 * corner at z = 3), which no layer of the box would contain.
 */
export function visualPosition(p: Vec3, dims: Dims): [number, number, number] {
  return [0, 1, 2].map((a) => {
    const coords = layerCoords(dims[a]!)
    const step = coords.length > 1 ? coords[1]! - coords[0]! : 1
    return p[a]! / step
  }) as [number, number, number]
}

/** Gap between two neighboring cubies, so the pieces read as separate blocks. */
export const CUBIE_GAP = 0.04
