import { create } from 'zustand'
import { applyMove, solvedCube } from '@/lib/cube'
import { scramble as makeScramble } from '@/lib/moves'
import { SOLVE_METHODS, type MethodId, type SolveStep } from '@/lib/solver'
import type { Cube, Move } from '@/lib/types'

/** What the currently playing queue represents (drives status + UI labels). */
type Mode = 'idle' | 'scrambling' | 'solving'

interface CubeStore {
  cube: Cube
  /** Moves waiting to be animated, in order. */
  queue: Move[]
  /** Move currently being animated, or null when idle. */
  active: Move | null
  mode: Mode
  /** Seconds a single quarter turn takes to animate. */
  turnDuration: number

  /** Selected solving method. */
  method: MethodId
  /** Named steps of the current solution, or null. */
  steps: SolveStep[] | null
  /** How many steps have already been sent to the animation queue. */
  stepIndex: number

  /** True while any move is queued or animating. */
  isBusy: () => boolean

  pushMove: (move: Move) => void
  scramble: () => void
  setMethod: (method: MethodId) => void
  /** Compute the solution steps for the current cube (does not animate). */
  prepareSolution: () => SolveStep[]
  /** Queue the whole solution and animate it. */
  solveAll: () => void
  /** Queue only the next not-yet-played step (step-by-step learning). */
  playNextStep: () => void
  reset: () => void
  stop: () => void
  /** Replace the cube with a specific state (used by the editor). */
  loadCube: (cube: Cube) => void
  setTurnDuration: (seconds: number) => void

  /** Animation driver hooks (called from the 3D loop). */
  startNext: () => void
  commitActive: () => void
}

function clearSolution() {
  return { steps: null, stepIndex: 0 }
}

export const useCube = create<CubeStore>((set, get) => ({
  cube: solvedCube(),
  queue: [],
  active: null,
  mode: 'idle',
  turnDuration: 0.2,
  method: 'beginner',
  steps: null,
  stepIndex: 0,

  isBusy: () => get().active !== null || get().queue.length > 0,

  pushMove: (move) => set((s) => ({ queue: [...s.queue, move], mode: 'idle', ...clearSolution() })),

  scramble: () =>
    set({ queue: makeScramble(20), mode: 'scrambling', active: null, ...clearSolution() }),

  setMethod: (method) => set({ method, ...clearSolution() }),

  prepareSolution: () => {
    const method = SOLVE_METHODS.find((m) => m.id === get().method) ?? SOLVE_METHODS[0]!
    const steps = method.solve(get().cube)
    set({ steps, stepIndex: 0, mode: 'solving', queue: [], active: null })
    return steps
  },

  solveAll: () => {
    const steps = get().prepareSolution()
    set({ queue: steps.flatMap((s) => [...s.moves]), stepIndex: steps.length })
  },

  playNextStep: () => {
    const steps = get().steps ?? get().prepareSolution()
    set((s) => {
      if (s.stepIndex >= steps.length) return s
      return { queue: [...s.queue, ...steps[s.stepIndex]!.moves], stepIndex: s.stepIndex + 1 }
    })
  },

  reset: () =>
    set({ cube: solvedCube(), queue: [], active: null, mode: 'idle', ...clearSolution() }),

  loadCube: (cube) => set({ cube, queue: [], active: null, mode: 'idle', ...clearSolution() }),

  stop: () => set({ queue: [], active: null, mode: 'idle' }),

  setTurnDuration: (seconds) => set({ turnDuration: seconds }),

  startNext: () =>
    set((s) => {
      if (s.active || s.queue.length === 0) return s
      return { active: s.queue[0]!, queue: s.queue.slice(1) }
    }),

  commitActive: () =>
    set((s) => {
      if (!s.active) return s
      const cube = applyMove(s.cube, s.active)
      const done = s.queue.length === 0
      return { cube, active: null, mode: done ? 'idle' : s.mode }
    }),
}))
