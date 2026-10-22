import { cubeShape, isSolved, stateKey, turnDims } from '../core/cube'
import { isGridless } from '../core/shapes'
import { applyMove, applyMoves, turnAllowed } from '../core/turn'
import { simplifyMoves } from '../core/moves'
import { formatMove, parseMoves } from '../core/notation'
import { allows, type MoveSet } from '../core/moveSet'
import { withoutRotations } from './rotations'
import type { Cube, Face, Move, Turn } from '../core/types'

/**
 * Shared solving machinery: bounded searches whose goals encode "do not
 * regress earlier work", frame remapping for algorithms written relative to a
 * front face, and the step contract (StepSpec, buildSteps). The methods
 * (methods/, solver4/) compose these bricks with the piece search of
 * pieceSearch.ts; the registry is solver.ts.
 */

export const SIDES: readonly Face[] = ['F', 'R', 'B', 'L']

// ---------------------------------------------------------------------------
// Shortest-path search over generator turns
// ---------------------------------------------------------------------------

/** Quarter-turn generators for plain face turns (the 2x2/3x3 move set). */
export function faceGenerators(faces: readonly Face[]): readonly Move[] {
  return faces.map((face) => ({ face, amount: 1 }))
}

/** Every plain face turn, as search generators. */
export const OUTER_GENERATORS = faceGenerators(['U', 'D', 'L', 'R', 'F', 'B'])

/**
 * Breadth-first search for the shortest sequence from `start` to a state
 * satisfying `goal`, using the quarter-turn `generators` (amount is explored
 * 1..3 for each). Kept fast by restricting the generators and by only ever
 * solving shallow goals. Throws past `maxDepth`.
 *
 * `keyFn` dedupes visited states; the default is the full state. When the goal
 * only reads a subset of pieces (say, centers), a key projected on that subset
 * is sound - every piece kind evolves independently under moves - and prunes
 * enormously, because states differing only elsewhere collapse.
 */
export function search(
  start: Cube,
  goal: (c: Cube) => boolean,
  generators: readonly Move[],
  maxDepth: number,
  keyFn: (c: Cube) => string = stateKey,
): Move[] {
  if (goal(start)) return []
  interface Node {
    cube: Cube
    moves: Move[]
    last: Move | null
  }
  let frontier: Node[] = [{ cube: start, moves: [], last: null }]
  const seen = new Set<string>([keyFn(start)])
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: Node[] = []
    for (const node of frontier) {
      for (const gen of generators) {
        if (gen === node.last) continue // same layers would just merge
        let cube = node.cube
        for (let amount = 1; amount <= 3; amount++) {
          cube = applyMove(cube, gen)
          const move: Move = { ...gen, amount: amount as 1 | 2 | 3 }
          if (goal(cube)) return [...node.moves, move]
          const key = keyFn(cube)
          if (!seen.has(key)) {
            seen.add(key)
            next.push({ cube, moves: [...node.moves, move], last: gen })
          }
        }
      }
    }
    frontier = next
  }
  throw new Error('search: no solution within depth')
}

// ---------------------------------------------------------------------------
// Frame remapping + "align U, then apply an algorithm" search
// ---------------------------------------------------------------------------

/** Map a relative move (algorithm written for front = F) to a given front face. */
function relToAbs(rel: Face, front: Face): Face {
  if (rel === 'U' || rel === 'D') return rel
  const i = SIDES.indexOf(rel)
  const j = SIDES.indexOf(front)
  return SIDES[(i + j) % 4]!
}

export function relMoves(alg: string, front: Face): Move[] {
  return parseMoves(alg).map((m) => ({ ...m, face: relToAbs(m.face, front) }))
}

function auf(k: number): Move[] {
  return k === 0 ? [] : [{ face: 'U', amount: k as 1 | 2 | 3 }]
}

/** The same relative algorithm applied with each side face as "front". */
export function atEverySide(alg: string): Move[][] {
  return SIDES.map((f) => relMoves(alg, f))
}

/**
 * Search for a solution built from steps of the form "(align U by k) then
 * apply one of `algs`", up to `maxApps` steps, ending with an optional U
 * alignment. Every candidate algorithm restores the layers already solved, so
 * any sequence reaching `goal` does so without regressing earlier work.
 *
 * Branching is tiny (4 AUF x |algs|) and duplicate states are pruned, so the
 * reachable set stays small and the search is fast despite the object model.
 */
export function solveWithAlgs(
  state: Cube,
  algs: Move[][],
  goal: (c: Cube) => boolean,
  maxApps: number,
): Move[] {
  interface Node {
    cube: Cube
    moves: Move[]
  }
  let frontier: Node[] = [{ cube: state, moves: [] }]
  const seen = new Set<string>([stateKey(state)])
  for (let app = 0; ; app++) {
    for (const node of frontier) {
      for (let k = 0; k <= 3; k++) {
        const m = auf(k)
        if (goal(applyMoves(node.cube, m))) return [...node.moves, ...m]
      }
    }
    if (app === maxApps) throw new Error('solveWithAlgs: no solution')
    const next: Node[] = []
    for (const node of frontier) {
      for (let k = 0; k <= 3; k++) {
        for (const alg of algs) {
          const seq = [...auf(k), ...alg]
          const cube = applyMoves(node.cube, seq)
          const key = stateKey(cube)
          if (seen.has(key)) continue
          seen.add(key)
          next.push({ cube, moves: [...node.moves, ...seq] })
        }
      }
    }
    frontier = next
  }
}

// ---------------------------------------------------------------------------
// Named steps
// ---------------------------------------------------------------------------

/**
 * One named stage of a method's solution. `key` is an i18n key describing the
 * step (e.g. the CFOP "F2L"); `moves` are the turns that complete it. Steps let
 * the UI teach a method by playing it one meaningful stage at a time.
 */
export interface SolveStep {
  readonly key: string
  readonly moves: readonly Turn[]
}

/**
 * One step of a method, declared rather than coded: what it is called, the
 * state it must reach and the turns it may use. Its phases do the work (in
 * order, each from the state the previous one left); `buildSteps` then checks
 * the contract, so a step can neither stop short of its goal nor sneak in a
 * turn its method forbids.
 */
export interface StepSpec {
  readonly key: string
  readonly goal: (c: Cube) => boolean
  readonly moves: MoveSet
  readonly phases: ReadonlyArray<(c: Cube) => Turn[]>
  /** A step most solutions skip (the 3x3's centers put back, the 4x4's
   *  parity): the plan shown before solving says so. */
  readonly optional?: true
}

/** A method's steps as shown before solving: their names, and the ones that
 *  may be skipped. Given the state to solve (`start`), the optional steps
 *  leading the plan that it already meets are left out, as its solution
 *  will (the 3x3's centers put back, when no slice moved them). */
export function planOutline(plan: MethodPlan, start?: Cube): { key: string; optional?: true }[] {
  const skipped = start ? plan.findIndex((spec) => !spec.optional || !spec.goal(start)) : 0
  return plan
    .slice(Math.max(0, skipped))
    .map((spec) => ({ key: spec.key, ...(spec.optional && { optional: spec.optional }) }))
}

/** A solving method for one shape: its steps, in order. */
export type MethodPlan = readonly StepSpec[]

/**
 * A plan read through a view of the puzzle (its colors only, the 3x3 it has
 * become, the way it is held...): each goal read on the view, each phase run
 * on it. Its turns play as they are, or through `lift` when the view turns
 * other layers than the puzzle (its allowed turns lifted alike).
 */
export function projectPlan(
  plan: MethodPlan,
  view: (cube: Cube) => Cube,
  lift?: (turn: Turn) => Turn,
): MethodPlan {
  return plan.map((spec) => ({
    ...spec,
    goal: (cube: Cube) => spec.goal(view(cube)),
    moves: lift
      ? { generators: spec.moves.generators.map(lift), turns: spec.moves.turns.map(lift) }
      : spec.moves,
    phases: spec.phases.map((phase) =>
      lift ? (cube: Cube) => phase(view(cube)).map(lift) : (cube: Cube) => phase(view(cube)),
    ),
  }))
}

/** A step that cannot reach its goal (an impossible puzzle, as far as this
 *  method goes): which one, for the editor to say where to look. */
export class StepFailure extends Error {
  readonly step: string
  constructor(step: string, cause: unknown) {
    super(`${step}: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.step = step
  }
}

/** Whether every turn goes in turn from `cube` (a blocked one does not). */
function goesFrom(cube: Cube, moves: readonly Turn[]): boolean {
  let state = cube
  for (const move of moves) {
    if (!turnAllowed(state, move)) return false
    state = applyMove(state, move)
  }
  return true
}

/** Run a method's steps, emitting one named step each (empty ones dropped). */
export function buildSteps(cube: Cube, plan: MethodPlan): SolveStep[] {
  if (isSolved(cube)) return []
  let state = cube
  const steps: SolveStep[] = []
  for (const spec of plan) {
    const start = state
    let moves: Turn[] = []
    for (const phase of spec.phases) {
      let m: Turn[]
      try {
        m = phase(state)
      } catch (cause) {
        throw new StepFailure(spec.key, cause)
      }
      state = applyMoves(state, m)
      moves = moves.concat(m)
    }
    // Tidied, unless that makes a turn its puzzle blocks (the Latch Cube's
    // X X X, played so because X' does not go).
    const tidy = simplifyMoves(moves)
    moves = goesFrom(start, tidy) ? tidy : moves
    if (!goesFrom(start, moves)) throw new Error(`${spec.key}: a turn is blocked`)
    const stray = moves.find((m) => !allows(spec.moves, m))
    if (stray) throw new Error(`${spec.key}: ${formatMove(stray)} is not an allowed turn`)
    if (!spec.goal(state)) throw new Error(`${spec.key}: goal not reached`)
    steps.push({
      key: spec.key,
      moves,
    })
  }
  return withoutTurnsInHand(cube, state, steps).filter((s) => s.moves.length > 0)
}

/** A solution's steps without its whole-puzzle turns made of layer turns
 *  (rotations.ts), if it solves the puzzle all the same (a method solving
 *  part of it only, or a puzzle without a grid, keeps its own). */
function withoutTurnsInHand(cube: Cube, end: Cube, steps: SolveStep[]): SolveStep[] {
  const shape = cubeShape(cube)
  if (isGridless(shape) || !isSolved(end)) return steps
  let lean = steps.map((s) => s.moves)
  // Tidied again after each pass: turns cancelled may bring two more
  // together that turn it whole.
  for (let pass = 0; pass < 4; pass++) {
    const next = withoutRotations(lean, turnDims(shape)).map((moves) => simplifyMoves(moves))
    if (next.flat().length === lean.flat().length) break
    lean = next
  }
  const moves = lean.flat()
  const unchanged = moves.length === steps.flatMap((s) => s.moves).length
  if (unchanged || !goesFrom(cube, moves)) return steps
  if (!isSolved(applyMoves(cube, moves))) return steps
  return steps.map((s, i) => ({ ...s, moves: lean[i]! }))
}
