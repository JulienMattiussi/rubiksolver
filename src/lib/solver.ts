import {
  applyMove,
  applyMoves,
  cubeOrientations,
  cubeSize,
  FACE_COLOR,
  FACE_NORMAL,
  isSolved,
  solvedCube,
} from './cube'
import { invertMoves, parseMoves, simplifyMoves } from './moves'
import type { Color, Cube, CubeSize, Cubie, Face, Move } from './types'

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

// ---------------------------------------------------------------------------
// 2x2 layer-by-layer solver
// ---------------------------------------------------------------------------
//
// A 2x2 has no centers, so there is no fixed color frame. The corner sitting
// at DBL (position [-1,-1,-1]) plays that role instead: its three stickers
// define the D/L/B reference colors (opposites follow from the standard color
// scheme). Predicates re-derive this frame from the state they inspect, so
// algorithms that move the anchor corner stay sound: a state satisfies a goal
// exactly when it is consistent with whatever corner then anchors it.

const OPPOSITE_COLOR: Record<Color, Color> = { W: 'Y', Y: 'W', G: 'B', B: 'G', R: 'O', O: 'R' }

/** Reference color of each face, anchored on the corner currently at DBL. */
function frame2(cube: Cube): Record<Face, Color> {
  const dbl = cube.find((c) => c.position[0] === -1 && c.position[1] === -1 && c.position[2] === -1)
  const d = dbl && colorAt(dbl, 'D')
  const l = dbl && colorAt(dbl, 'L')
  const b = dbl && colorAt(dbl, 'B')
  if (!d || !l || !b) throw new Error('frame2: no corner at DBL')
  return { D: d, L: l, B: b, U: OPPOSITE_COLOR[d], R: OPPOSITE_COLOR[l], F: OPPOSITE_COLOR[b] }
}

/** The three bottom corners to place around the DBL anchor (which is the BL one). */
const BOTTOM_PAIRS_2: ReadonlyArray<readonly [Face, Face]> = [
  ['L', 'F'],
  ['F', 'R'],
  ['R', 'B'],
]

function bottomCornerPlaced2(cube: Cube, s1: Face, s2: Face): boolean {
  const f = frame2(cube)
  const corner = findCorner(cube, f.D, f[s1], f[s2])
  return (
    colorAt(corner, 'D') === f.D && colorAt(corner, s1) === f[s1] && colorAt(corner, s2) === f[s2]
  )
}

export function bottomLayerDone2(cube: Cube): boolean {
  return BOTTOM_PAIRS_2.every(([a, b]) => bottomCornerPlaced2(cube, a, b))
}

/** Bottom layer done and every U sticker shows the frame's U color. */
export function topFaceDone2(cube: Cube): boolean {
  if (!bottomLayerDone2(cube)) return false
  const u = frame2(cube).U
  return cube.every((c) => {
    const color = colorAt(c, 'U')
    return color === undefined || color === u
  })
}

export function solveBottomLayer2(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  for (const [s1, s2] of BOTTOM_PAIRS_2) {
    if (bottomCornerPlaced2(state, s1, s2)) continue
    const prior = BOTTOM_PAIRS_2.filter(([a, b]) => bottomCornerPlaced2(state, a, b))
    const goal = (c: Cube) =>
      prior.every(([a, b]) => bottomCornerPlaced2(c, a, b)) && bottomCornerPlaced2(c, s1, s2)
    const moves = solveWithAlgs(state, CORNER_TRIGGERS, goal, 5)
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  return all
}

export function solveTopFace2(cube: Cube): Move[] {
  return solveWithAlgs(cube, atEverySide(OLL_SUNE), topFaceDone2, 8)
}

// Last-layer corner permutation: T-perm swaps two adjacent U corners, Y-perm
// two diagonal ones (their edge cycles are irrelevant on a 2x2). Both keep the
// D layer intact, so with an AUF one application reaches every case.
const PLL_T = "R U R' U' R' F R2 U' R' U' R U R' F'"
const PLL_Y = "F R U' R' U' R U R' F' R U R' U' R' F R F'"

export function solvePermuteTop2(cube: Cube): Move[] {
  return solveWithAlgs(cube, [...atEverySide(PLL_T), ...atEverySide(PLL_Y)], isSolved, 3)
}

// ---------------------------------------------------------------------------
// 2x2 optimal solver (bidirectional breadth-first search)
// ---------------------------------------------------------------------------

/** U/R/F generate the whole 2x2 group while never moving the DBL corner. */
const MOVES_URF: readonly Face[] = ['U', 'R', 'F']

/** God's number for the 2x2 is 11 half-turn-metric moves, so a solvable cube
 *  always meets within a combined search depth of 11; 12 proves impossibility. */
const MAX_DEPTH_2 = 12

interface BfsSide {
  frontier: Array<{ cube: Cube; moves: Move[] }>
  /** Shortest move sequence (from this side's origin) per visited state key. */
  visited: Map<string, Move[]>
}

function bfsSide(origin: Cube): BfsSide {
  return { frontier: [{ cube: origin, moves: [] }], visited: new Map([[stateKey(origin), []]]) }
}

/**
 * Optimal 2x2 solution by bidirectional BFS over U/R/F turns, from `cube`
 * towards the orientation of the solved cube that shares its DBL corner (URF
 * turns never move that corner, so both searches walk the same coset).
 *
 * A meet gives forward-moves + inverted backward-moves. The first meet may not
 * be the best one, so the search keeps expanding until the two depths add up
 * to the best total found; any shorter solution would already have met.
 * Throws when depth `MAX_DEPTH_2` is exhausted, i.e. the cube is unsolvable.
 */
export function solveOptimal2(cube: Cube): Move[] {
  const target = cubeOrientations(solvedCube(2)).find((t) => {
    try {
      const f = frame2(t)
      const g = frame2(cube)
      return f.D === g.D && f.L === g.L && f.B === g.B
    } catch {
      return false
    }
  })
  if (!target) throw new Error('solveOptimal2: DBL piece is not a real corner')
  if (stateKey(cube) === stateKey(target)) return []

  const fwd = bfsSide(cube)
  const bwd = bfsSide(target)
  let best: Move[] | null = null
  let fwdDepth = 0
  let bwdDepth = 0

  while (fwdDepth + bwdDepth < Math.min(best?.length ?? Infinity, MAX_DEPTH_2)) {
    const expand = fwd.frontier.length <= bwd.frontier.length ? fwd : bwd
    const other = expand === fwd ? bwd : fwd
    if (expand === fwd) fwdDepth++
    else bwdDepth++
    const next: BfsSide['frontier'] = []
    for (const node of expand.frontier) {
      const lastFace = node.moves[node.moves.length - 1]?.face
      for (const face of MOVES_URF) {
        if (face === lastFace) continue
        let state = node.cube
        for (let amount = 1; amount <= 3; amount++) {
          state = applyMove(state, { face, amount: 1 })
          const moves = [...node.moves, { face, amount: amount as 1 | 2 | 3 }]
          const key = stateKey(state)
          const met = other.visited.get(key)
          if (met && (!best || moves.length + met.length < best.length)) {
            const [f, b] = expand === fwd ? [moves, met] : [met, moves]
            best = [...f, ...invertMoves(b)]
          }
          if (!expand.visited.has(key)) {
            expand.visited.set(key, moves)
            next.push({ cube: state, moves })
          }
        }
      }
    }
    expand.frontier = next
  }
  if (!best) throw new Error('solveOptimal2: no solution (unsolvable cube)')
  return best
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

/** 2x2 layer by layer: bottom corners, orient the top, permute the top. */
function beginner2Steps(cube: Cube): SolveStep[] {
  return buildSteps(cube, [
    { key: 'stepBottomCorners', phases: [solveBottomLayer2] },
    { key: 'stepOrientCorners', phases: [solveTopFace2] },
    { key: 'stepPermuteCorners', phases: [solvePermuteTop2] },
  ])
}

/** 2x2 optimal solution, as a single step. */
function optimalSteps(cube: Cube): SolveStep[] {
  return buildSteps(cube, [{ key: 'stepOptimal', phases: [solveOptimal2] }])
}

/** Identifier of an available solving method. */
export type MethodId = 'beginner' | 'cfop' | 'optimal'

/** Registry of solving methods: each returns its solution as named steps. */
const SOLVE_METHODS: ReadonlyArray<{
  id: MethodId
  sizes: readonly CubeSize[]
  solve: (cube: Cube) => SolveStep[]
}> = [
  {
    id: 'beginner',
    sizes: [2, 3],
    solve: (cube) => (cubeSize(cube) === 2 ? beginner2Steps(cube) : beginnerSteps(cube)),
  },
  { id: 'cfop', sizes: [3], solve: cfopSteps },
  { id: 'optimal', sizes: [2], solve: optimalSteps },
]

/** The solving methods available for a given cube size. */
export function methodsFor(size: CubeSize) {
  return SOLVE_METHODS.filter((m) => m.sizes.includes(size))
}

/**
 * Default full solve, kept for validation and callers. Both branches throw on
 * an unsolvable cube after a bounded search, which is what validate.ts needs.
 */
export function solve(cube: Cube): Move[] {
  if (cubeSize(cube) === 2) return solveOptimal2(cube)
  return beginnerSteps(cube).flatMap((s) => [...s.moves])
}
