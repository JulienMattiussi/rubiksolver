import { cubeShape } from '@/lib/cube'
import type { ModelProps } from './CubeModel'
import { NO_PIECES } from './noPieces'
import { StarPiece } from './StarPiece'
import { STAR_YAW } from './starGeometry'

/** A star prism drawn from its logical state; the turning pieces are parented
 *  to the animated group, inside the yaw that sets the slash plane facing
 *  the viewer. Shared by the scene and the move guide. */
export function StarModel({ cube, groupRef, isTurning, highlighted = NO_PIECES }: ModelProps) {
  const tall = cubeShape(cube) === 'star4'
  return (
    <group rotation={[0, STAR_YAW, 0]}>
      {cube.map((c, i) =>
        isTurning(i) ? null : (
          <StarPiece key={i} cubie={c} tall={tall} highlighted={highlighted(i)} />
        ),
      )}
      <group ref={groupRef}>
        {cube.map((c, i) => (isTurning(i) ? <StarPiece key={i} cubie={c} tall={tall} /> : null))}
      </group>
    </group>
  )
}
