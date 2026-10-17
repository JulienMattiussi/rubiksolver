import { create } from 'zustand'
import { cubeShape, isSolved, stateKey } from '@/lib/core/cube'
import { invertMoves } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Move, Turn } from '@/lib/core/types'
import type { Hold } from '@/lib/core/hold'
import { tutorialFor, type TutorialPick } from '@/lib/tutorial/tutorial'
import { useCube } from './cubeStore'

/** A formula played (its moves), and the pick it was played for, on the
 *  state it left (`cube`, its key `on`), and the key of the state it led
 *  to (`after`); the turns played by hand before it, since its step began
 *  (`manual`), are undone with it. */
interface Played {
  readonly pick: TutorialPick | null
  readonly moves: readonly Move[]
  readonly cube: Cube
  readonly on: string
  readonly after: string
  readonly manual: readonly Turn[]
}

interface TutorialStore {
  /** The tutorial is on: the solve panel gives way to it. */
  active: boolean
  /** The piece and place the user picked, on the state `pickedOn` names
   *  (stale once the cube changes: the suggestion then shows). Turns by
   *  hand keep it: it follows them. */
  pick: TutorialPick | null
  pickedOn: string | null
  /** The formulas played, last last: undoing one brings its pick back. */
  played: readonly Played[]
  /** The turns played by hand since the step began (the pad's, the
   *  formula's own buttons'): applying then finishes the step from there,
   *  undoing goes back to where it began. */
  manual: readonly Turn[]
  /** The last formula played is being looked at, before the next step: its
   *  pieces where they went, until `next`. */
  review: boolean
  /** Counts the steps validated on a puzzle that turns by hand had already
   *  solved (no formula left to play): each one is celebrated. */
  cheers: number
  /** The way the puzzle is held for the step under way (null: the
   *  tutorial is off): the pad reads its turns from there too. */
  hold: Hold | null
  /** Hold the puzzle another way (the panel's, following its step). */
  setHold: (hold: Hold | null) => void
  /** The furthest stage the tutorial has shown: a stage the puzzle meets
   *  before it comes to it is shown all the same, in passing. */
  stageShown: number
  /** Note a stage as shown. */
  showStage: (stage: number) => void
  /** Counts the stages done (a stage's last step validated, the puzzle not
   *  solved yet): each one is cheered (StageCheer). */
  stagesDone: number
  start: () => void
  exit: () => void
  /** Pick a piece and where it goes (null: back to the suggestion). */
  choose: (pick: TutorialPick | null) => void
  /** Play a step's formula for a pick, then forget the pick: the next step
   *  suggests. */
  apply: (step: { key: string; moves: Move[] }, pick: TutorialPick | null) => void
  /** The moves shown in the formulas validated so far (as read held, in
   *  the international notation): a move not shown yet keeps its words. */
  learnt: readonly string[]
  /** Note a formula's moves as shown. */
  learn: (moves: readonly string[]) => void
  /** Undo the turns played by hand since the step began, or else the last
   *  formula played (with the turns by hand before it), its pick back:
   *  applying plays it again. */
  undo: () => void
  /** Done looking at the formula played: on to the next step. */
  next: () => void
}

const IDLE = { pick: null, pickedOn: null, played: [], manual: [], review: false }

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  active: false,
  cheers: 0,
  stagesDone: 0,
  stageShown: 0,
  showStage: (stage) => set((s) => (stage > s.stageShown ? { stageShown: stage } : s)),
  learnt: [],
  learn: (moves) => set((s) => ({ learnt: [...new Set([...s.learnt, ...moves])] })),
  hold: null,
  setHold: (hold) => set({ hold }),
  ...IDLE,

  start: () => {
    // A solution shown or under way gives way: the list shows the tutorial's.
    useCube.getState().stop()
    useCube.getState().setSpeedMode('tutorial')
    set({ active: true, learnt: [], stageShown: 0, ...IDLE })
  },

  exit: () => {
    useCube.getState().stop()
    useCube.getState().setSpeedMode('play')
    set({ active: false, hold: null, ...IDLE })
  },

  choose: (pick) => set({ pick, pickedOn: pick && stateKey(useCube.getState().cube) }),

  apply: (step, pick) => {
    const cube = useCube.getState().cube
    const played: Played = {
      pick,
      moves: step.moves,
      cube,
      on: stateKey(cube),
      after: stateKey(applyMoves(cube, step.moves)),
      manual: get().manual,
    }
    // Turns by hand may have done it all: nothing left to play.
    if (step.moves.length > 0) useCube.getState().playStep(step)
    else if (isSolved(cube)) set((s) => ({ cheers: s.cheers + 1 }))
    // The step began where turns by hand were not yet played: its stage over?
    const tutorial = tutorialFor(cubeShape(cube))
    const began = tutorial?.stepOf(applyMoves(cube, invertMoves(get().manual)))
    const after = applyMoves(cube, step.moves)
    if (began?.stage && !isSolved(after) && tutorial?.stepOf(after)?.key !== began.key) {
      set((s) => ({ stagesDone: s.stagesDone + 1 }))
    }
    set((s) => ({
      pick: null,
      pickedOn: null,
      played: [...s.played, played],
      manual: [],
      review: true,
    }))
  },

  undo: () => {
    const { played, manual } = get()
    const cube = useCube.getState()
    if (manual.length > 0) {
      // Back to where the step began, its pick kept.
      cube.playTurns(invertMoves(manual))
      const pick = get().pick
      set({
        manual: [],
        review: false,
        pickedOn: pick && stateKey(applyMoves(cube.cube, invertMoves(manual))),
      })
      return
    }
    const last = played[played.length - 1]
    if (!last) return
    // The formula off the solution's list while it still shows it; then the
    // turns by hand before it.
    if (last.moves.length > 0) {
      if (cube.dispatched > 0) cube.undoStep()
      else cube.playTurns(invertMoves(last.moves))
    }
    if (last.manual.length > 0) useCube.getState().playTurns(invertMoves(last.manual))
    const begun = applyMoves(last.cube, invertMoves(last.manual))
    set({
      pick: last.pick,
      pickedOn: last.pick && stateKey(begun),
      played: played.slice(0, -1),
      manual: [],
      review: false,
    })
  },

  next: () => set({ review: false }),
}))

// A turn by hand (not a formula's, nor a scramble's: those play as a solve
// or a scramble) is kept for the step, and the pick shown follows it.
useCube.subscribe((now, before) => {
  const tutorial = useTutorialStore.getState()
  // Another puzzle chosen: the tutorial is left.
  if (tutorial.active && cubeShape(now.cube) !== cubeShape(before.cube)) {
    useTutorialStore.setState({ active: false, hold: null, ...IDLE })
    useCube.getState().setSpeedMode('play')
    return
  }
  const turn = before.active
  if (!tutorial.active || !turn || now.active || before.solving || before.scrambling) return
  // The suggestion where the step began, before the turns by hand.
  const begun = applyMoves(before.cube, invertMoves(tutorial.manual))
  const step = tutorialFor(cubeShape(before.cube))?.stepOf(before.cube, begun)
  const shown =
    tutorial.pick && tutorial.pickedOn === stateKey(before.cube)
      ? tutorial.pick
      : (step?.suggestion ?? null)
  useTutorialStore.setState({
    manual: [...tutorial.manual, turn],
    review: false,
    pick: shown,
    pickedOn: shown && stateKey(now.cube),
  })
})
