import type { RefObject } from 'react'
import type * as THREE from 'three'
import { cubeDims } from '@/lib/core/cube'
import { centeringOffset, LAYER_THICKNESS } from '@/lib/core/shape'
import type { Cube, CubeVariant } from '@/lib/core/types'
import { Cubie } from './Cubie'
import { cubeScale, drawnIn } from './layout'
import { NO_PIECES } from './noPieces'

export interface ModelProps {
  cube: Cube
  /** Group the turning pieces are parented to (the animation rotates it). */
  groupRef: RefObject<THREE.Group | null>
  isTurning: (index: number) => boolean
  /** Group of the pieces turning half as far (a Gear Cube's slice), and
   *  which they are; none on other puzzles. */
  halfRef?: RefObject<THREE.Group | null>
  isHalfTurning?: (index: number) => boolean
  /** The sixths a Gear Cube's turning gears spin (+-5), and how far along
   *  the turn is (0 to 1), for them to spin along. */
  turnSpin?: number
  progress?: RefObject<number>
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
  halfRef,
  isHalfTurning = NO_PIECES,
  turnSpin,
  progress,
  highlighted = NO_PIECES,
}: ModelProps & { variant: CubeVariant }) {
  const dims = cubeDims(cube)
  // A Gear Cube: small center squares, the edges' clips around them.
  const gear = cube.some((c) => c.spin !== undefined)
  const drawn = drawnIn(cube)
  const shown = (i: number) => drawn(cube[i]!)
  const [ox, oy, oz] = centeringOffset(LAYER_THICKNESS[variant])
  return (
    <group scale={cubeScale(dims)}>
      <group position={[ox, oy, oz]}>
        {cube.map((c, i) =>
          isTurning(i) || isHalfTurning(i) || !shown(i) ? null : (
            <Cubie
              key={i}
              cubie={c}
              dims={dims}
              variant={variant}
              highlighted={highlighted(i)}
              smallCenter={gear}
            />
          ),
        )}
        <group ref={groupRef}>
          {cube.map((c, i) =>
            isTurning(i) && shown(i) ? (
              <Cubie key={i} cubie={c} dims={dims} variant={variant} smallCenter={gear} />
            ) : null,
          )}
        </group>
        <group ref={halfRef}>
          {cube.map((c, i) =>
            isHalfTurning(i) ? (
              <Cubie
                key={i}
                cubie={c}
                dims={dims}
                variant={variant}
                spinning={turnSpin}
                progress={progress}
                smallCenter={gear}
              />
            ) : null,
          )}
        </group>
      </group>
    </group>
  )
}
