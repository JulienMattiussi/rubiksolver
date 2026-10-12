import { create } from 'zustand'
import { cubeShape, isSolved, solvedCube, stateKey } from '@/lib/cube'
import { applyMove } from '@/lib/turn'
import { invertMoves, scrambleTurns } from '@/lib/moves'
import { stepEnd, stepStart } from '@/lib/progress'
import { methodsFor, type MethodId, type SolveStep } from '@/lib/solver'
import { supportsMirror, type Cube, type CubeShape, type CubeVariant, type Turn } from '@/lib/types'

/** Scramble length per shape: enough to reach any state, without dragging on. */
const SCRAMBLE_LENGTH: Record<CubeShape, number> = {
  '2': 11,
  '3': 20,
  '4': 40,
  '5': 60,
  '123': 10,
  '224': 25,
  '223': 20,
  '332': 20,
  '331': 12,
  pyra: 11,
  pyra4: 30,
  pyra5: 40,
  jing: 15,
  morph: 11,
  oct4: 40,
  rainbow: 20,
  ghost: 15,
  star: 20,
  star4: 40,
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
  /** Where the solution stands once the queue is played: how many of its
   *  moves are done (going back undoes the last ones). */
  dispatched: number
  /** The queue undoes moves of the solution (going back), rather than
   *  playing them: the steps list reads its progress the other way. */
  rewinding: boolean
  /** What `steps` were computed for (`planKey`): a solution computed ahead
   *  (useAutoPlan) is reused by Solve and the step and move buttons while
   *  it still holds. */
  plannedFor: string | null

  pushMove: (move: Turn) => void
  scramble: () => void
  /** Switch shape: resets to a solved puzzle of that shape. */
  setShape: (shape: CubeShape) => void
  /** Switch rendering variant. Keeps the current state: it is only a skin. */
  setVariant: (variant: CubeVariant) => void
  setMethod: (method: MethodId) => void
  /** Compute the solution steps for the current cube (does not animate),
   *  or take the one computed ahead for it. */
  prepareSolution: () => SolveStep[]
  /** Show a solution computed ahead for the state `key` names, if the cube
   *  still stands there, idle and unsolved by anything else. */
  setPlan: (steps: SolveStep[], key: string) => void
  /** Queue the rest of the solution (all of it, if none is under way). */
  solveAll: () => void
  /** Queue the rest of the step under way, or the next step (step by step). */
  playNextStep: () => void
  /** Queue the solution's next move alone (move by move). */
  playNextMove: () => void
  /** Undo the step under way, or the previous step at a step boundary. */
  undoStep: () => void
  /** Undo the solution's last move played. */
  undoMove: () => void
  reset: () => void
  /** Halt the queue. The solution goes with it: the cube now sits between
   *  two of its steps, so neither "all played" nor "next step" holds. */
  stop: () => void
  /** Pause a solution playing: the move under way ends, the rest waits.
   *  The solution stays, its position where that move leaves it, so the
   *  step and move buttons (or Solve) carry on from there. */
  pause: () => void
  /** Replace the cube with a specific state (used by the editor). */
  loadCube: (cube: Cube) => void
  setTurnDuration: (seconds: number) => void

  /** Animation driver hooks (called from the 3D loop). */
  startNext: () => void
  commitActive: () => void
}

function clearSolution() {
  return { steps: null, dispatched: 0, rewinding: false, plannedFor: null }
}

/** Names a state and a method: what a solution is computed for. */
export const planKey = (s: { cube: Cube; method: MethodId }): string =>
  `${s.method}|${stateKey(s.cube)}`

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

/** Whether a turn just solved the puzzle: the one that ended (`prev` had it
 *  under way) left it solved, unsolved before. A reset, a new puzzle or a
 *  restored state do not count: no turn brought them. */
export const solvedByTurn = (prev: CubeStore, next: CubeStore): boolean =>
  prev.active !== null && next.active === null && !isSolved(prev.cube) && isSolved(next.cube)

const lengthsOf = (steps: readonly SolveStep[]) => steps.map((s) => s.moves.length)

/**
 * Move along the solution to the position `to` picks (in moves from its
 * start): forward plays the moves in between, backward undoes them (each
 * inverted, last first). The solution is computed first if none is under
 * way; going back never leaves it, it only walks it the other way.
 */
function goTo(to: (steps: readonly SolveStep[], dispatched: number) => number) {
  const state = useCube.getState()
  const steps = state.dispatched > 0 && state.steps ? state.steps : state.prepareSolution()
  useCube.setState((s) => {
    const moves = steps.flatMap((step) => [...step.moves])
    const target = Math.max(0, Math.min(to(steps, s.dispatched), moves.length))
    if (target === s.dispatched) return s
    const rewinding = target < s.dispatched
    const turns = rewinding
      ? invertMoves(moves.slice(target, s.dispatched))
      : moves.slice(s.dispatched, target)
    return { queue: [...s.queue, ...turns], dispatched: target, rewinding, solving: true }
  })
}

export const useCube = create<CubeStore>((set, get) => ({
  cube: solvedCube(),
  variant: 'classic',
  queue: [],
  active: null,
  solving: false,
  turnDuration: 0.2,
  method: 'beginner',
  steps: null,
  dispatched: 0,
  rewinding: false,
  plannedFor: null,

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
    const s = get()
    const ahead = s.steps && s.dispatched === 0 && s.plannedFor === planKey(s) ? s.steps : null
    const methods = methodsFor(cubeShape(s.cube))
    const method = methods.find((m) => m.id === s.method) ?? methods[0]
    if (!method) throw new Error('prepareSolution: no solving method for this shape')
    const steps = ahead ?? method.solve(s.cube)
    set({ steps, dispatched: 0, solving: true, queue: [], active: null, plannedFor: planKey(s) })
    return steps
  },

  setPlan: (steps, key) =>
    set((s) => (s.steps || selectBusy(s) || planKey(s) !== key ? s : { steps, plannedFor: key })),

  solveAll: () => goTo((steps) => lengthsOf(steps).reduce((n, len) => n + len, 0)),

  playNextStep: () => goTo((steps, dispatched) => stepEnd(lengthsOf(steps), dispatched)),

  playNextMove: () => goTo((_, dispatched) => dispatched + 1),

  undoStep: () => goTo((steps, dispatched) => stepStart(lengthsOf(steps), dispatched)),

  undoMove: () => goTo((_, dispatched) => dispatched - 1),

  reset: () => set((s) => loadedCube(solvedCube(cubeShape(s.cube)))),

  loadCube: (cube) => set(loadedCube(cube)),

  stop: () => set({ queue: [], active: null, solving: false, ...clearSolution() }),

  pause: () =>
    set((s) => {
      if (!s.solving || s.queue.length === 0) return s
      // The queued moves are dropped: the solution stands that many short of
      // where it was heading (that many past it, going back).
      const dispatched = s.rewinding ? s.dispatched + s.queue.length : s.dispatched - s.queue.length
      return { queue: [], dispatched, solving: s.active !== null }
    }),

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
