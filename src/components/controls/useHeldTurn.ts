import { cubeShape } from '@/lib/core/cube'
import type { Turn } from '@/lib/core/types'
import { tutorialFor } from '@/lib/tutorials/registry'
import { useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'

/** A pad's turn as the puzzle is held in the tutorial (`tutorialStore.hold`,
 *  read in its tutorial's frame): a button names a side where it stands and
 *  turns that side of the puzzle. Off the tutorial, the turn as is. */
export function useHeldTurn(): <T extends Turn>(turn: T) => T {
  const shape = useCube((s) => cubeShape(s.cube))
  const method = useCube((s) => s.method)
  const hold = useTutorialStore((s) => s.hold)
  const frame = tutorialFor(shape, method)?.frame
  return (turn) => (hold && frame ? (frame.played(hold, turn) as typeof turn) : turn)
}
