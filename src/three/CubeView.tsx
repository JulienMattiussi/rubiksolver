import { cubeDims } from '@/lib/cube'
import { turnAllowed, turnedBy } from '@/lib/turn'
import { centeringOffset, LAYER_THICKNESS } from '@/lib/shape'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { Cubie } from './Cubie'
import { cubeScale } from './layout'
import { useTurnAnimation } from './useTurnAnimation'

/** Renders the cubies from the logical cube state; the turning layer is
 *  parented to an animated group (see useTurnAnimation). The recentering group
 *  sits outside it, so turns keep rotating around the cube's own axes. While a
 *  pad button is hovered, the pieces its turn would move are highlighted. */
export function CubeView() {
  const cube = useCube((s) => s.cube)
  const variant = useCube((s) => s.variant)
  const dims = cubeDims(cube)
  const [ox, oy, oz] = centeringOffset(LAYER_THICKNESS[variant])
  const { groupRef, isTurning } = useTurnAnimation()
  const preview = useView((s) => s.preview)
  const idle = !useCube(selectBusy)
  const highlighted =
    preview && idle && turnAllowed(cube, preview) ? turnedBy(cube, preview) : () => false
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
