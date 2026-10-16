import { create } from 'zustand'
import { cubeShape, stateKey } from '@/lib/core/cube'
import { invertMoves } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Move, Turn } from '@/lib/core/types'
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
  start: () => void
  exit: () => void
  /** Pick a piece and where it goes (null: back to the suggestion). */
  choose: (pick: TutorialPick | null) => void
  /** Play a step's formula for a pick, then forget the pick: the next step
   *  suggests. */
  apply: (step: { key: string; moves: Move[] }, pick: TutorialPick | null) => void
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
  ...IDLE,

  start: () => {
    // A solution shown or under way gives way: the list shows the tutorial's.
    useCube.getState().stop()
    set({ active: true, ...IDLE })
  },

  exit: () => {
    useCube.getState().stop()
    set({ active: false, ...IDLE })
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
  const turn = before.active
  if (!tutorial.active || !turn || now.active || before.solving || before.scrambling) return
  const step = tutorialFor(cubeShape(before.cube))?.stepOf(before.cube)
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
