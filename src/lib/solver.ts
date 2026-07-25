import { applyMove, applyMoves, FACE_COLOR, FACE_NORMAL, isSolved } from './cube'
import { parseMoves, simplifyMoves } from './moves'
import type { Color, Cube, Cubie, Face, Move } from './types'

/**
 * Layer-by-layer (beginner method) solver.
 *
 * Frame: yellow (D) is the first layer, white (U) is the last layer.
 * Phases:
 *   1. Bottom (yellow) cross          - shortest-path search
 *   2. Bottom corners                 - stage the piece on top, then a local search inserts it
 *   3. Middle-layer edges             - same stage-then-insert idea
 *   4. Top (white) cross              - orient last-layer edges  (alg + AUF search)
 *   5. Orient last-layer corners      - alg + AUF search
 *   6. Permute last-layer corners     - alg + AUF search
 *   7. Permute last-layer edges       - alg + AUF search
 *
 * The moves for every phase are found by a small search rather than fixed
 * notation, so a returned sequence is guaranteed to satisfy the phase goal.
 * The last three phases search over "align U, then apply a known algorithm",
 * which keeps the branching tiny while the four base algorithms (validated in
 * tests) generate every case. Solutions are long but always correct.
 */

const SIDES: readonly Face[] = ['F', 'R', 'B', 'L']
const ALL_TURN_FACES: readonly Face[] = ['U', 'D', 'F', 'B', 'L', 'R']

// Base last-layer algorithms, written for front = F (remapped per side below).
const OLL_EDGE = "F R U R' U' F'" // orients last-layer edges (top cross)
const OLL_SUNE = "R U R' U R U2 R'" // orients last-layer corners
const PLL_CORNER = "R' F R' B2 R F' R' B2 R2" // Aa-perm: pure 3-cycle of U corners
const PLL_EDGE = "R U' R U R U R U' R' U' R2" // Ua-perm: pure 3-cycle of U edges

// ---------------------------------------------------------------------------
// Piece queries
// ---------------------------------------------------------------------------

/** Color of the sticker on `cubie` pointing along face `f`, if any. */
function colorAt(cubie: Cubie, f: Face): Color | undefined {
  const n = FACE_NORMAL[f]
  return cubie.stickers.find(
    (s) => s.normal[0] === n[0] && s.normal[1] === n[1] && s.normal[2] === n[2],
  )?.color
}

function sameColorSet(cubie: Cubie, colors: readonly Color[]): boolean {
  if (cubie.stickers.length !== colors.length) return false
  const have = cubie.stickers.map((s) => s.color).sort()
  const want = [...colors].sort()
  return have.every((c, i) => c === want[i])
}

/** Find the edge cubie carrying exactly the two given colors. */
function findEdge(cube: Cube, a: Color, b: Color): Cubie {
  const piece = cube.find((c) => sameColorSet(c, [a, b]))
  if (!piece) throw new Error(`Edge ${a}${b} not found`)
  return piece
}

/** Find the corner cubie carrying exactly the three given colors. */
function findCorner(cube: Cube, a: Color, b: Color, c: Color): Cubie {
  const piece = cube.find((cc) => sameColorSet(cc, [a, b, c]))
  if (!piece) throw new Error(`Corner ${a}${b}${c} not found`)
  return piece
}

// ---------------------------------------------------------------------------
// Phase predicates (exported for tests)
// ---------------------------------------------------------------------------

function edgePlaced(cube: Cube, s: Face): boolean {
  const edge = findEdge(cube, FACE_COLOR.D, FACE_COLOR[s])
  return colorAt(edge, 'D') === FACE_COLOR.D && colorAt(edge, s) === FACE_COLOR[s]
}

export function crossDone(cube: Cube): boolean {
  return SIDES.every((s) => edgePlaced(cube, s))
}

function cornerPlaced(cube: Cube, s1: Face, s2: Face): boolean {
  const corner = findCorner(cube, FACE_COLOR.D, FACE_COLOR[s1], FACE_COLOR[s2])
  return (
    colorAt(corner, 'D') === FACE_COLOR.D &&
    colorAt(corner, s1) === FACE_COLOR[s1] &&
    colorAt(corner, s2) === FACE_COLOR[s2]
  )
}

const CORNER_PAIRS: ReadonlyArray<readonly [Face, Face]> = [
  ['F', 'R'],
  ['R', 'B'],
  ['B', 'L'],
  ['L', 'F'],
]

export function firstLayerDone(cube: Cube): boolean {
  return crossDone(cube) && CORNER_PAIRS.every(([a, b]) => cornerPlaced(cube, a, b))
}

function middleEdgePlaced(cube: Cube, s1: Face, s2: Face): boolean {
  const edge = findEdge(cube, FACE_COLOR[s1], FACE_COLOR[s2])
  return colorAt(edge, s1) === FACE_COLOR[s1] && colorAt(edge, s2) === FACE_COLOR[s2]
}

export function secondLayerDone(cube: Cube): boolean {
  return firstLayerDone(cube) && CORNER_PAIRS.every(([a, b]) => middleEdgePlaced(cube, a, b))
}

/** White cross on U: all four U-edges show white on top. */
export function topCrossDone(cube: Cube): boolean {
  if (!secondLayerDone(cube)) return false
  return SIDES.every(
    (s) => colorAt(findEdge(cube, FACE_COLOR.U, FACE_COLOR[s]), 'U') === FACE_COLOR.U,
  )
}

/** Entire U face oriented white (last layer oriented). */
export function topFaceDone(cube: Cube): boolean {
  if (!topCrossDone(cube)) return false
  return cube
    .filter((c) => colorAt(c, 'U') !== undefined)
    .every((c) => colorAt(c, 'U') === FACE_COLOR.U)
}

/** Last-layer corners oriented and correctly placed. */
export function topCornersDone(cube: Cube): boolean {
  if (!topFaceDone(cube)) return false
  return CORNER_PAIRS.every(([a, b]) => {
    const corner = findCorner(cube, FACE_COLOR.U, FACE_COLOR[a], FACE_COLOR[b])
    return colorAt(corner, a) === FACE_COLOR[a] && colorAt(corner, b) === FACE_COLOR[b]
  })
}

// ---------------------------------------------------------------------------
// Shortest-path search over face turns
// ---------------------------------------------------------------------------

/** Index 0..5 of a face normal, for compact hashing. */
function normalIndex(n: readonly [number, number, number]): number {
  if (n[0] !== 0) return n[0] > 0 ? 0 : 1
  if (n[1] !== 0) return n[1] > 0 ? 2 : 3
  return n[2] > 0 ? 4 : 5
}

/**
 * Compact, allocation-light state signature. Cubies keep a stable array index
 * (applyMove maps in place), so encoding each by position + its stickers in
 * order is deterministic. Used to dedupe search states, so it must be fast.
 */
function stateKey(cube: Cube): string {
  let out = ''
  for (const c of cube) {
    out += (c.position[0] + 1) * 9 + (c.position[1] + 1) * 3 + (c.position[2] + 1)
    for (const s of c.stickers) out += normalIndex(s.normal).toString() + s.color
    out += '|'
  }
  return out
}

/**
 * Breadth-first search for the shortest sequence from `start` to a state
 * satisfying `goal`, turning only faces in `faces`. Kept fast by restricting
 * `faces` and by only ever solving shallow goals. Throws past `maxDepth`.
 */
function search(
  start: Cube,
  goal: (c: Cube) => boolean,
  faces: readonly Face[],
  maxDepth: number,
): Move[] {
  if (goal(start)) return []
  interface Node {
    cube: Cube
    moves: Move[]
    lastFace: Face | null
  }
  let frontier: Node[] = [{ cube: start, moves: [], lastFace: null }]
  const seen = new Set<string>([stateKey(start)])
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: Node[] = []
    for (const node of frontier) {
      for (const face of faces) {
        if (face === node.lastFace) continue
        let cube = node.cube
        for (let amount = 1; amount <= 3; amount++) {
          cube = applyMove(cube, { face, amount: 1 })
          const move: Move = { face, amount: amount as 1 | 2 | 3 }
          if (goal(cube)) return [...node.moves, move]
          const key = stateKey(cube)
          if (!seen.has(key)) {
            seen.add(key)
            next.push({ cube, moves: [...node.moves, move], lastFace: face })
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

function relMoves(alg: string, front: Face): Move[] {
  return parseMoves(alg).map((m) => ({ face: relToAbs(m.face, front), amount: m.amount }))
}

function auf(k: number): Move[] {
  return k === 0 ? [] : [{ face: 'U', amount: k as 1 | 2 | 3 }]
}

/** The same relative algorithm applied with each side face as "front". */
function atEverySide(alg: string): Move[][] {
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
function solveWithAlgs(
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
// Phases
// ---------------------------------------------------------------------------

export function solveCross(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  for (const s of SIDES) {
    if (edgePlaced(state, s)) continue
    const placed = SIDES.filter((x) => edgePlaced(state, x))
    const goal = (c: Cube) => placed.every((x) => edgePlaced(c, x)) && edgePlaced(c, s)
    const moves = search(state, goal, ALL_TURN_FACES, 8)
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  return all
}

// Insertion triggers, tried at every side so the search can extract a piece
// from a wrong slot and drop it into the right one.
const CORNER_TRIGGERS = [...atEverySide("R U R'"), ...atEverySide("R U' R'")]
const MIDDLE_TRIGGERS = [
  ...atEverySide("U R U' R' U' F' U F"), // insert edge into the front-right slot
  ...atEverySide("U' L' U L U F U' F'"), // insert edge into the front-left slot
]

export function solveFirstLayerCorners(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  for (const [s1, s2] of CORNER_PAIRS) {
    if (cornerPlaced(state, s1, s2)) continue
    const prior = CORNER_PAIRS.filter(([a, b]) => cornerPlaced(state, a, b))
    const goal = (c: Cube) =>
      crossDone(c) && prior.every(([a, b]) => cornerPlaced(c, a, b)) && cornerPlaced(c, s1, s2)
    const moves = solveWithAlgs(state, CORNER_TRIGGERS, goal, 5)
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  return all
}

export function solveMiddleLayer(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  for (const [s1, s2] of CORNER_PAIRS) {
    if (middleEdgePlaced(state, s1, s2)) continue
    const prior = CORNER_PAIRS.filter(([a, b]) => middleEdgePlaced(state, a, b))
    const goal = (c: Cube) =>
      firstLayerDone(c) &&
      prior.every(([a, b]) => middleEdgePlaced(c, a, b)) &&
      middleEdgePlaced(c, s1, s2)
    const moves = solveWithAlgs(state, MIDDLE_TRIGGERS, goal, 5)
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  return all
}

export function solveTopCross(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(OLL_EDGE, 'F')], topCrossDone, 4)
}

export function solveTopFace(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(OLL_SUNE, 'F')], topFaceDone, 8)
}

export function solvePermuteCorners(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(PLL_CORNER, 'F')], topCornersDone, 6)
}

export function solvePermuteEdges(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(PLL_EDGE, 'F')], isSolved, 6)
}

// F2L solved slot by slot (CFOP structure): for each column the corner then its
// middle edge is placed, keeping every finished slot intact.
const F2L_TRIGGERS = [...atEverySide("R U R'"), ...atEverySide("R U' R'")]

function pairPlaced(cube: Cube, s1: Face, s2: Face): boolean {
  return cornerPlaced(cube, s1, s2) && middleEdgePlaced(cube, s1, s2)
}

function solveF2L(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  const push = (moves: Move[]) => {
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  for (const [s1, s2] of CORNER_PAIRS) {
    if (pairPlaced(state, s1, s2)) continue
    const prior = CORNER_PAIRS.filter(([a, b]) => pairPlaced(state, a, b))
    const priorOk = (c: Cube) => crossDone(c) && prior.every(([a, b]) => pairPlaced(c, a, b))
    push(solveWithAlgs(state, F2L_TRIGGERS, (c) => priorOk(c) && cornerPlaced(c, s1, s2), 6))
    push(
      solveWithAlgs(
        state,
        MIDDLE_TRIGGERS,
        (c) => priorOk(c) && cornerPlaced(c, s1, s2) && middleEdgePlaced(c, s1, s2),
        6,
      ),
    )
  }
  return all
}

/**
 * One named stage of a method's solution. `key` is an i18n key describing the
 * step (e.g. the CFOP "F2L"); `moves` are the turns that complete it. Steps let
 * the UI teach a method by playing it one meaningful stage at a time.
 */
export interface SolveStep {
  readonly key: string
  readonly moves: readonly Move[]
}

interface StepSpec {
  key: string
  phases: ReadonlyArray<(c: Cube) => Move[]>
}

/** Run grouped phases, emitting one named step per group. */
function buildSteps(cube: Cube, groups: readonly StepSpec[]): SolveStep[] {
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

/** Beginner "layer by layer" method, taught as its seven classic stages. */
function beginnerSteps(cube: Cube): SolveStep[] {
  return buildSteps(cube, [
    { key: 'stepBottomCross', phases: [solveCross] },
    { key: 'stepBottomCorners', phases: [solveFirstLayerCorners] },
    { key: 'stepMiddle', phases: [solveMiddleLayer] },
    { key: 'stepTopCross', phases: [solveTopCross] },
    { key: 'stepOrientCorners', phases: [solveTopFace] },
    { key: 'stepPermuteCorners', phases: [solvePermuteCorners] },
    { key: 'stepPermuteEdges', phases: [solvePermuteEdges] },
  ])
}

/** CFOP (Fridrich), taught as its four stages: Cross, F2L, OLL, PLL. */
function cfopSteps(cube: Cube): SolveStep[] {
  return buildSteps(cube, [
    { key: 'stepCross', phases: [solveCross] },
    { key: 'stepF2L', phases: [solveF2L] },
    { key: 'stepOLL', phases: [solveTopCross, solveTopFace] },
    { key: 'stepPLL', phases: [solvePermuteCorners, solvePermuteEdges] },
  ])
}

/** Identifier of an available solving method. */
export type MethodId = 'beginner' | 'cfop'

/** Registry of solving methods: each returns its solution as named steps. */
export const SOLVE_METHODS: ReadonlyArray<{
  id: MethodId
  solve: (cube: Cube) => SolveStep[]
}> = [
  { id: 'beginner', solve: beginnerSteps },
  { id: 'cfop', solve: cfopSteps },
]

/** Default full solve (beginner method), kept for validation and callers. */
export function solve(cube: Cube): Move[] {
  return beginnerSteps(cube).flatMap((s) => [...s.moves])
}
