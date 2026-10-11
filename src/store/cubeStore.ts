import { create } from 'zustand'
import { cubeShape, isSolved, solvedCube } from '@/lib/cube'
import { applyMove } from '@/lib/turn'
import { scrambleTurns } from '@/lib/moves'
import { methodsFor, type MethodId, type SolveStep } from '@/lib/solver'
import { supportsMirror, type Cube, type CubeShape, type CubeVariant, type Turn } from '@/lib/types'

/** Scramble length per shape: enough to reach any state, without dragging on. */
const SCRAMBLE_LENGTH: Record<CubeShape, number> = {
  '2': 11,
  '3': 20,
  '4': 40,
  '123': 10,
  '224': 25,
  '223': 20,
  '332': 20,
  '331': 12,
  star: 20,
}

interface CubeStore {
  /** Logical cube state; its shape is derived via `cubeShape(cube)`. */
  cube: Cube
  /** How the cube is drawn. Purely visual: nothing else reads it. */
  variant: CubeVariant
  /** Moves waiting to be animated, in order. */
  queue: Turn[]
  /** Move currently being animated, or null when idle. */
  active: Turn | null
  /** The queue plays a solution (the status says so), not a scramble or a
   *  hand turn. */
  solving: boolean
  /** Seconds a single quarter turn takes to animate. */
  turnDuration: number

  /** Selected solving method. */
  method: MethodId
  /** Named steps of the current solution, or null. */
  steps: SolveStep[] | null
  /** How many steps have already been sent to the animation queue. */
  stepIndex: number

  pushMove: (move: Turn) => void
  scramble: () => void
  /** Switch shape: resets to a solved puzzle of that shape. */
  setShape: (shape: CubeShape) => void
  /** Switch rendering variant. Keeps the current state: it is only a skin. */
  setVariant: (variant: CubeVariant) => void
  setMethod: (method: MethodId) => void
  /** Compute the solution steps for the current cube (does not animate). */
  prepareSolution: () => SolveStep[]
  /** Queue the whole solution and animate it. */
  solveAll: () => void
  /** Queue only the next not-yet-played step (step-by-step learning). */
  playNextStep: () => void
  reset: () => void
  /** Halt the queue. The solution goes with it: the cube now sits between
   *  two of its steps, so neither "all played" nor "next step" holds. */
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

/** Idle state around a freshly loaded cube (reset, shape switch, editor load). */
function loadedCube(cube: Cube) {
  return {
    cube,
    queue: [] as Turn[],
    active: null as Turn | null,
    solving: false,
    ...clearSolution(),
  }
}

/** A move is queued or animating: the controls wait. */
export const selectBusy = (s: CubeStore): boolean => s.active !== null || s.queue.length > 0

export const selectSolved = (s: CubeStore): boolean => isSolved(s.cube)

export const useCube = create<CubeStore>((set, get) => ({
  cube: solvedCube(),
  variant: 'classic',
  queue: [],
  active: null,
  solving: false,
  turnDuration: 0.2,
  method: 'beginner',
  steps: null,
  stepIndex: 0,

  pushMove: (move) =>
    set((s) => ({ queue: [...s.queue, move], solving: false, ...clearSolution() })),

  scramble: () =>
    set((s) => ({
      // From the current state: a shape-shifting puzzle's legal turns depend on it.
      queue: scrambleTurns(
        cubeShape(s.cube),
        SCRAMBLE_LENGTH[cubeShape(s.cube)],
        Math.random,
        s.cube,
      ),
      solving: false,
      active: null,
      ...clearSolution(),
    })),

  setShape: (shape) =>
    set((s) => {
      if (shape === cubeShape(s.cube)) return s
      const methods = methodsFor(shape)
      const method = methods.some((m) => m.id === s.method)
        ? s.method
        : (methods[0]?.id ?? s.method)
      // A shape without a mirror version falls back to the classic rendering.
      const variant = supportsMirror(shape) ? s.variant : 'classic'
      return { method, variant, ...loadedCube(solvedCube(shape)) }
    }),

  setVariant: (variant) => set({ variant }),

  setMethod: (method) => set({ method, ...clearSolution() }),

  prepareSolution: () => {
    const methods = methodsFor(cubeShape(get().cube))
    const method = methods.find((m) => m.id === get().method) ?? methods[0]
    if (!method) throw new Error('prepareSolution: no solving method for this shape')
    const steps = method.solve(get().cube)
    set({ steps, stepIndex: 0, solving: true, queue: [], active: null })
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

  reset: () => set((s) => loadedCube(solvedCube(cubeShape(s.cube)))),

  loadCube: (cube) => set(loadedCube(cube)),

  stop: () => set({ queue: [], active: null, solving: false, ...clearSolution() }),

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
      return { cube, active: null, solving: done ? false : s.solving }
    }),
}))
