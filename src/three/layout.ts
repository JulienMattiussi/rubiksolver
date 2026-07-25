import type { CubeSize, Vec3 } from '@/lib/types'

export interface CubeLayout {
  /** Uniform scale applied to the whole cube group. */
  readonly scale: number
  /** Factor mapping logical cubie coordinates to visual positions. */
  readonly positionFactor: number
}

/**
 * Visual layout per cube size. Logical 2x2 coordinates live in {-1,1} (one
 * unit of empty space between cubies), so positions are halved to make the
 * cubies adjacent, then the whole cube is scaled up so both sizes occupy a
 * similar volume in front of the camera.
 */
export function cubeLayout(size: CubeSize): CubeLayout {
  return size === 2 ? { scale: 1.5, positionFactor: 0.5 } : { scale: 1, positionFactor: 1 }
}

/** Map a logical cubie/slot position to its visual position. */
export function scalePosition(p: Vec3, factor: number): [number, number, number] {
  return [p[0] * factor, p[1] * factor, p[2] * factor]
}
