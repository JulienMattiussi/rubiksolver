import { cubeShape } from '@/lib/core/cube'
import { tutorialFor } from '@/lib/tutorial/tutorial'
import { useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { TutorialPanel } from '@/components/tutorial/TutorialPanel'
import { SolvePanel } from './SolvePanel'

/** The solve block, or the tutorial in its place while it is on (and the
 *  puzzle has one). */
export function SolveArea({ home = false }: { home?: boolean }) {
  const tutorial = useTutorialStore((s) => s.active)
  const has = useCube((s) => tutorialFor(cubeShape(s.cube)) !== undefined)
  return tutorial && has && !home ? <TutorialPanel /> : <SolvePanel home={home} />
}
