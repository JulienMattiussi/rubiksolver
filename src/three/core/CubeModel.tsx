import type { ReactNode, RefObject } from 'react'
import type * as THREE from 'three'
import { cubeDims, cubeShape } from '@/lib/core/cube'
import { centeringOffset, LAYER_THICKNESS } from '@/lib/core/shape'
import type { Cube, CubeVariant } from '@/lib/core/types'
import { Cubie } from './Cubie'
import { cubeScale, drawnIn } from './layout'
import { NO_PIECES } from './noPieces'
import { ownViewsOf } from '@/three/puzzles/views'

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
  /** Pieces hatched (a tutorial formula moves them, not placed yet). */
  hatched?: (index: number) => boolean
  /** The piece standing where a tutorial formula takes its piece. */
  marked?: (index: number) => boolean
  /** The highlighted and marked pieces' glow pulsing (the tutorial's). */
  pulse?: boolean
  /** A click on a piece (the tutorial's), on those it takes
   *  (`pickable`), and the pointer coming onto one and leaving it. */
  onPick?: (index: number) => void
  pickable?: (index: number) => boolean
  onPickHover?: (index: number, on: boolean) => void
  /** Drawn in the pieces' frame (the tutorial's arrow). */
  children?: ReactNode
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
  hatched = NO_PIECES,
  marked = NO_PIECES,
  pulse = false,
  onPick,
  pickable = NO_PIECES,
  onPickHover,
  children,
}: ModelProps & { variant: CubeVariant }) {
  const dims = cubeDims(cube)
  // A puzzle drawn from its own pieces (a Gear Cube's: small center
  // squares, the edges' clips around them).
  const own = ownViewsOf(cubeShape(cube))?.piece
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
              hatched={hatched(i)}
              marked={marked(i)}
              pulse={pulse}
              onPick={onPick && pickable(i) ? () => onPick(i) : undefined}
              onPickHover={onPickHover && ((on) => onPickHover(i, on))}
              own={own}
            />
          ),
        )}
        <group ref={groupRef}>
          {cube.map((c, i) =>
            isTurning(i) && shown(i) ? (
              <Cubie
                key={i}
                cubie={c}
                dims={dims}
                variant={variant}
                highlighted={highlighted(i)}
                hatched={hatched(i)}
                own={own}
              />
            ) : null,
          )}
        </group>
        {children}
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
                own={own}
              />
            ) : null,
          )}
        </group>
      </group>
    </group>
  )
}
