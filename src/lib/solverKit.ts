import { applyMove, applyMoves, FACE_NORMAL, isSolved, stateKey } from './cube'
import { parseMoves, simplifyMoves } from './moves'
import type { Color, Cube, Cubie, Face, Move } from './types'

/**
 * Shared solving machinery: bounded searches whose goals encode "do not
 * regress earlier work", frame remapping for algorithms written relative to a
 * front face, and the named-step builder. Method-specific solvers (per size)
 * compose these bricks; see solver.ts and solver4/.
 */

export const SIDES: readonly Face[] = ['F', 'R', 'B', 'L']

// ---------------------------------------------------------------------------
// Piece queries
// ---------------------------------------------------------------------------

/** Color of the sticker on `cubie` pointing along face `f`, if any. */
export function colorAt(cubie: Cubie, f: Face): Color | undefined {
  const n = FACE_NORMAL[f]
  return cubie.stickers.find(
    (s) => s.normal[0] === n[0] && s.normal[1] === n[1] && s.normal[2] === n[2],
  )?.color
}

export function sameColorSet(cubie: Cubie, colors: readonly Color[]): boolean {
  if (cubie.stickers.length !== colors.length) return false
  const have = cubie.stickers.map((s) => s.color).sort()
  const want = [...colors].sort()
  return have.every((c, i) => c === want[i])
}

// ---------------------------------------------------------------------------
// Shortest-path search over generator turns
// ---------------------------------------------------------------------------

/** Quarter-turn generators for plain face turns (the 2x2/3x3 move set). */
export function faceGenerators(faces: readonly Face[]): readonly Move[] {
  return faces.map((face) => ({ face, amount: 1 }))
}

/**
 * Breadth-first search over whole move SEQUENCES: every generator is applied
 * as a block, so a shape that forbids quarter turns, or a phase that may only
 * use sequences preserving earlier work, hands over exactly what it allows.
 * Same dedup rules as `search`. Throws past `maxDepth`.
 */
export function searchSequences(
  start: Cube,
  goal: (c: Cube) => boolean,
  generators: readonly (readonly Move[])[],
  maxDepth: number,
  keyFn: (c: Cube) => string = stateKey,
): Move[] {
  if (goal(start)) return []
  let frontier: Array<{ cube: Cube; moves: Move[] }> = [{ cube: start, moves: [] }]
  const seen = new Set<string>([keyFn(start)])
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: typeof frontier = []
    for (const node of frontier) {
      for (const gen of generators) {
        const cube = applyMoves(node.cube, gen)
        const key = keyFn(cube)
        if (seen.has(key)) continue
        const moves = [...node.moves, ...gen]
        if (goal(cube)) return moves
        seen.add(key)
        next.push({ cube, moves })
      }
    }
    frontier = next
  }
  throw new Error('searchSequences: no solution within the search depth')
}

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
  readonly moves: readonly Move[]
}

export interface StepSpec {
  key: string
  phases: ReadonlyArray<(c: Cube) => Move[]>
}

/** Run grouped phases, emitting one named step per group. */
export function buildSteps(cube: Cube, groups: readonly StepSpec[]): SolveStep[] {
  if (isSolved(cube)) return []
  let state = cube
  const steps: SolveStep[] = []
  for (const group of groups) {
    let moves: Move[] = []
    for (const phase of group.phases) {
      const m = phase(state)
      state = applyMoves(state, m)
      moves = moves.concat(m)
    }
    steps.push({ key: group.key, moves: simplifyMoves(moves) })
  }
  return steps.filter((s) => s.moves.length > 0)
}
