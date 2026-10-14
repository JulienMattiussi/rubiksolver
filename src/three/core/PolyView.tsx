import { useCube } from '@/store/cubeStore'
import { PolyModel } from './PolyModel'
import { usePreviewed } from './usePreviewed'
import { useTurnAnimation } from './useTurnAnimation'

/** The scene's gridless puzzle (a star prism, the Pyraminx), animated like
 *  the cubes. */
export function PolyView() {
  const cube = useCube((s) => s.cube)
  const { groupRef, isTurning } = useTurnAnimation()
  const highlighted = usePreviewed()
  return (
    <PolyModel cube={cube} groupRef={groupRef} isTurning={isTurning} highlighted={highlighted} />
  )
}
