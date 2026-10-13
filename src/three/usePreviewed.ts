import { halfTurnedBy, turnAllowed, turnedBy } from '@/lib/turn'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { NO_PIECES } from './noPieces'

/** Which cubies (by index) the hovered pad turn would move, for highlighting:
 *  none while a turn animates, or when the hovered turn is jammed. */
export function usePreviewed(): (index: number) => boolean {
  const cube = useCube((s) => s.cube)
  const preview = useView((s) => s.preview)
  const idle = !useCube(selectBusy)
  if (!preview || !idle || !turnAllowed(cube, preview)) return NO_PIECES
  // A Gear Cube's slice turns too, half as far.
  const full = turnedBy(cube, preview)
  const half = halfTurnedBy(cube, preview)
  return (index) => full(index) || half(index)
}
