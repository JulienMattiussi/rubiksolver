import { turnAllowed, turnedBy } from '@/lib/turn'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { NO_PIECES } from './noPieces'

/** Which cubies (by index) the hovered pad turn would move, for highlighting:
 *  none while a turn animates, or when the hovered turn is jammed. */
export function usePreviewed(): (index: number) => boolean {
  const cube = useCube((s) => s.cube)
  const preview = useView((s) => s.preview)
  const idle = !useCube(selectBusy)
  return preview && idle && turnAllowed(cube, preview) ? turnedBy(cube, preview) : NO_PIECES
}
