import { cubeShape } from '@/lib/cube'
import { useCube } from '@/store/cubeStore'
import { StarPiece } from './StarPiece'
import { STAR_YAW } from './starGeometry'
import { usePreviewed } from './usePreviewed'
import { useTurnAnimation } from './useTurnAnimation'

/** Renders a star prism; the turning pieces are parented to the animated
 *  group, inside the yaw that sets the slash plane facing the viewer. */
export function StarView() {
  const cube = useCube((s) => s.cube)
  const tall = cubeShape(cube) === 'star4'
  const { groupRef, isTurning } = useTurnAnimation()
  const highlighted = usePreviewed()
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
