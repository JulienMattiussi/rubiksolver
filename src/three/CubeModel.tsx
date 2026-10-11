import type { RefObject } from 'react'
import type * as THREE from 'three'
import { cubeDims } from '@/lib/cube'
import { centeringOffset, LAYER_THICKNESS } from '@/lib/shape'
import type { Cube, CubeVariant } from '@/lib/types'
import { Cubie } from './Cubie'
import { cubeScale } from './layout'
import { NO_PIECES } from './noPieces'

export interface ModelProps {
  cube: Cube
  /** Group the turning pieces are parented to (the animation rotates it). */
  groupRef: RefObject<THREE.Group | null>
  isTurning: (index: number) => boolean
  highlighted?: (index: number) => boolean
}

/** A grid puzzle drawn from its logical state, the turning layer in its own
 *  group. The recentering group sits outside it, so turns keep rotating
 *  around the cube's own axes. Shared by the scene and the move guide. */
export function CubeModel({
  cube,
  variant,
  groupRef,
  isTurning,
  highlighted = NO_PIECES,
}: ModelProps & { variant: CubeVariant }) {
  const dims = cubeDims(cube)
  const [ox, oy, oz] = centeringOffset(LAYER_THICKNESS[variant])
  return (
    <group scale={cubeScale(dims)}>
      <group position={[ox, oy, oz]}>
        {cube.map((c, i) =>
          isTurning(i) ? null : (
            <Cubie key={i} cubie={c} dims={dims} variant={variant} highlighted={highlighted(i)} />
          ),
        )}
        <group ref={groupRef}>
          {cube.map((c, i) =>
            isTurning(i) ? <Cubie key={i} cubie={c} dims={dims} variant={variant} /> : null,
          )}
        </group>
      </group>
    </group>
  )
}
