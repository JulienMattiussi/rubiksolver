import { useCube } from '@/store/cubeStore'
import { Cubie } from './Cubie'
import { cubeLayout } from './layout'
import { useTurnAnimation } from './useTurnAnimation'

/** Renders the cubies from the logical cube state; the turning layer is
 *  parented to an animated group (see useTurnAnimation). */
export function CubeView() {
  const cube = useCube((s) => s.cube)
  const size = useCube((s) => s.size)
  const { scale, positionFactor } = cubeLayout(size)
  const { groupRef, isTurning } = useTurnAnimation()
  return (
    <group scale={scale}>
      {cube.map((c, i) =>
        isTurning(i) ? null : <Cubie key={i} cubie={c} positionFactor={positionFactor} />,
      )}
      <group ref={groupRef}>
        {cube.map((c, i) =>
          isTurning(i) ? <Cubie key={i} cubie={c} positionFactor={positionFactor} /> : null,
        )}
      </group>
    </group>
  )
}
