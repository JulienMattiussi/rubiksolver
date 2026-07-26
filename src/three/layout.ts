import type { CubeSize, Vec3 } from '@/lib/types'

export interface CubeLayout {
  /** Uniform scale applied to the whole cube group. */
  readonly scale: number
  /** Factor mapping logical cubie coordinates to visual positions. */
  readonly positionFactor: number
}

/**
 * Visual layout per cube size. Logical 2x2 and 4x4 coordinates are spaced two
 * units apart (to stay integers), so positions are halved to make the cubies
 * adjacent, then the whole cube is scaled so every size occupies the same
 * volume in front of the camera (an extent of 3 world units).
 */
const LAYOUTS: Record<CubeSize, CubeLayout> = {
  2: { scale: 1.5, positionFactor: 0.5 },
  3: { scale: 1, positionFactor: 1 },
  4: { scale: 0.75, positionFactor: 0.5 },
}

export function cubeLayout(size: CubeSize): CubeLayout {
  return LAYOUTS[size]
}

/** Gap between two neighboring cubies, so the pieces read as separate blocks. */
export const CUBIE_GAP = 0.04

/** Map a logical cubie/slot position to its visual position. */
export function scalePosition(p: Vec3, factor: number): [number, number, number] {
  return [p[0] * factor, p[1] * factor, p[2] * factor]
}
