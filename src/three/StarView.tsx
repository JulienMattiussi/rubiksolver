import { useCube } from '@/store/cubeStore'
import { StarModel } from './StarModel'
import { usePreviewed } from './usePreviewed'
import { useTurnAnimation } from './useTurnAnimation'

/** The scene's star prism, animated like the cubes. */
export function StarView() {
  const cube = useCube((s) => s.cube)
  const { groupRef, isTurning } = useTurnAnimation()
  const highlighted = usePreviewed()
  return (
    <StarModel cube={cube} groupRef={groupRef} isTurning={isTurning} highlighted={highlighted} />
  )
}
