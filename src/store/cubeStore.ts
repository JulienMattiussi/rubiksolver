import { create } from 'zustand'
import { applyMove, solvedCube } from '@/lib/cube'
import { scramble as makeScramble } from '@/lib/moves'
import { solve } from '@/lib/solver'
import type { Cube, Move } from '@/lib/types'

/** What the currently playing queue represents (drives status + UI labels). */
type Mode = 'idle' | 'scrambling' | 'solving'

interface CubeStore {
  cube: Cube
  /** Moves waiting to be animated, in order. */
  queue: Move[]
  /** Move currently being animated, or null when idle. */
  active: Move | null
  /** Last computed solution, kept for display. */
  solution: Move[] | null
  mode: Mode
  /** Seconds a single quarter turn takes to animate. */
  turnDuration: number

  /** True while any move is queued or animating. */
  isBusy: () => boolean

  pushMove: (move: Move) => void
  scramble: () => void
  solveCube: () => void
  reset: () => void
  stop: () => void
  setTurnDuration: (seconds: number) => void

  /** Animation driver hooks (called from the 3D loop). */
  startNext: () => void
  commitActive: () => void
}

export const useCube = create<CubeStore>((set, get) => ({
  cube: solvedCube(),
  queue: [],
  active: null,
  solution: null,
  mode: 'idle',
  turnDuration: 0.2,

  isBusy: () => get().active !== null || get().queue.length > 0,

  pushMove: (move) => set((s) => ({ queue: [...s.queue, move], mode: 'idle', solution: null })),

  scramble: () =>
    set({ queue: makeScramble(20), mode: 'scrambling', solution: null, active: null }),

  solveCube: () => {
    const solution = solve(get().cube)
    set({ queue: solution, solution, mode: 'solving', active: null })
  },

  reset: () => set({ cube: solvedCube(), queue: [], active: null, solution: null, mode: 'idle' }),

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
