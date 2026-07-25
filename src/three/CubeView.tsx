import { useCube } from '@/store/cubeStore'
import { Cubie } from './Cubie'
import { useTurnAnimation } from './useTurnAnimation'

/** Renders the 27 cubies from the logical cube state; the turning layer is
 *  parented to an animated group (see useTurnAnimation). */
export function CubeView() {
  const cube = useCube((s) => s.cube)
  const { groupRef, isTurning } = useTurnAnimation()
  return (
    <group>
      {cube.map((c, i) => (isTurning(i) ? null : <Cubie key={i} cubie={c} />))}
      <group ref={groupRef}>
        {cube.map((c, i) => (isTurning(i) ? <Cubie key={i} cubie={c} /> : null))}
      </group>
    </group>
  )
}
