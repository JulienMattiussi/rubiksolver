import { create } from 'zustand'

/**
 * How far the tutorial has gone, apart from playing it (tutorialStore):
 * the stages shown, the stages done and the ends reached (each celebrated),
 * and the turns shown so far. Cleared when a tutorial starts or ends.
 */
interface TutorialTrack {
  /** The furthest stage shown: a stage the puzzle meets before the
   *  tutorial comes to it is shown all the same, in passing. */
  stageShown: number
  showStage: (stage: number) => void
  /** Counts the stages done (a stage's last step validated, the puzzle not
   *  solved yet): each one cheered (StageCheer). */
  stagesDone: number
  stageDone: () => void
  /** Counts the tutorials ended (every stage shown, the puzzle solved):
   *  each one celebrated (Fireworks). */
  cheers: number
  cheer: () => void
  /** The turns shown in the formulas validated so far (as read held,
   *  written in the international notation): one not shown yet keeps its
   *  words beside it. */
  learnt: readonly string[]
  learn: (turns: readonly string[]) => void
  /** How many of the glossary's words are shown (step 0), on to the next,
   *  or so many (past them all, or back to the first). */
  termsShown: number
  showTerm: () => void
  setTermsShown: (count: number) => void
  /** Back to a tutorial's start (the counters kept: they only count up). */
  reset: () => void
}

export const useTutorialTrack = create<TutorialTrack>((set) => ({
  stageShown: 0,
  showStage: (stage) => set((s) => (stage > s.stageShown ? { stageShown: stage } : s)),
  stagesDone: 0,
  stageDone: () => set((s) => ({ stagesDone: s.stagesDone + 1 })),
  cheers: 0,
  cheer: () => set((s) => ({ cheers: s.cheers + 1 })),
  learnt: [],
  learn: (turns) => set((s) => ({ learnt: [...new Set([...s.learnt, ...turns])] })),
  termsShown: 0,
  showTerm: () => set((s) => ({ termsShown: s.termsShown + 1 })),
  setTermsShown: (count) => set({ termsShown: count }),
  reset: () => set({ stageShown: 0, learnt: [], termsShown: 0 }),
}))
