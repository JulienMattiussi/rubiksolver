import { create } from 'zustand'
import type { Cube, Turn } from '@/lib/core/types'
import type { TutorialStep } from '@/lib/teach/tutorial'
import { useCube } from './cubeStore'
import { useTutorialStore } from './tutorialStore'
import { useTutorialTrack } from './tutorialTrack'

/** A formula of the reminder shown on the puzzle (see `formulaExample`):
 *  which one (`id`), its example, drawn in place of the puzzle, the turns
 *  it makes and the step reading them. */
interface Example {
  readonly id: string
  readonly cube: Cube
  readonly moves: readonly Turn[]
  readonly step: TutorialStep
}

/**
 * The reminder's formula shown on the puzzle, over it: the puzzle itself
 * stays as it is (the tutorial's progress with it), and comes back as soon
 * as anything happens to it, the reminder closes or the tutorial ends.
 */
interface ExampleStore {
  example: Example | null
  /** Show a formula's example, or close it if it is the one shown. */
  toggle: (example: Example) => void
  close: () => void
}

export const useExample = create<ExampleStore>((set) => ({
  example: null,
  toggle: (example) => set((s) => ({ example: s.example?.id === example.id ? null : example })),
  close: () => set({ example: null }),
}))

const close = () => {
  if (useExample.getState().example) useExample.getState().close()
}
// A turn, a new state or another puzzle: the puzzle itself again.
useCube.subscribe((now, before) => {
  if (now.cube !== before.cube || now.queue !== before.queue) close()
})
// The reminder left (the step back in its place), or the tutorial.
useTutorialTrack.subscribe((now, before) => {
  if (before.recapShown && !now.recapShown) close()
})
useTutorialStore.subscribe((now, before) => {
  if (before.active && !now.active) close()
})

/** The puzzle drawn: the example shown, else the puzzle itself. */
export function useShownCube(): Cube {
  const cube = useCube((s) => s.cube)
  return useExample((s) => s.example?.cube) ?? cube
}
