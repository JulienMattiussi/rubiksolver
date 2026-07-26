import {
  applyMove,
  applyMoves,
  cubeOrientations,
  cubeShape,
  FACE_COLOR,
  isSolved,
  OPPOSITE_COLOR,
  solvedCube,
  stateKey,
} from './cube'
import { invertMoves, movesFor } from './moves'
import {
  atEverySide,
  buildSteps,
  colorAt,
  faceGenerators,
  relMoves,
  sameColorSet,
  search,
  SIDES,
  solveWithAlgs,
  type SolveStep,
  type StepSpec,
} from './solverKit'
import { reductionSteps } from './solver4/steps'
import type { Color, Cube, CubeShape, Cubie, Face, Move } from './types'

export type { SolveStep } from './solverKit'

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

const ALL_TURN_FACES: readonly Face[] = ['U', 'D', 'F', 'B', 'L', 'R']
const OUTER_GENERATORS = faceGenerators(ALL_TURN_FACES)

// Base last-layer algorithms, written for front = F (remapped per side below).
const OLL_EDGE = "F R U R' U' F'" // orients last-layer edges (top cross)
const OLL_SUNE = "R U R' U R U2 R'" // orients last-layer corners
const PLL_CORNER = "R' F R' B2 R F' R' B2 R2" // Aa-perm: pure 3-cycle of U corners
const PLL_EDGE = "R U' R U R U R U' R' U' R2" // Ua-perm: pure 3-cycle of U edges

// ---------------------------------------------------------------------------
// Piece queries
// ---------------------------------------------------------------------------

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

/** The corner carrying `frame`'s (D, s1, s2) colors sits at its slot, correctly
 *  oriented. Shared by the 3x3 (fixed frame) and the 2x2 (DBL-anchored frame). */
function cornerPlacedIn(cube: Cube, frame: Record<Face, Color>, s1: Face, s2: Face): boolean {
  const corner = findCorner(cube, frame.D, frame[s1], frame[s2])
  return (
    colorAt(corner, 'D') === frame.D &&
    colorAt(corner, s1) === frame[s1] &&
    colorAt(corner, s2) === frame[s2]
  )
}

function cornerPlaced(cube: Cube, s1: Face, s2: Face): boolean {
  return cornerPlacedIn(cube, FACE_COLOR, s1, s2)
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
// Phases
// ---------------------------------------------------------------------------

export function solveCross(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  for (const s of SIDES) {
    if (edgePlaced(state, s)) continue
    const placed = SIDES.filter((x) => edgePlaced(state, x))
    const goal = (c: Cube) => placed.every((x) => edgePlaced(c, x)) && edgePlaced(c, s)
    const moves = search(state, goal, OUTER_GENERATORS, 8)
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

/**
 * Place pieces one at a time: for each side pair not yet `placed`, search for
 * trigger applications that place it while `baseGoal` and every previously
 * placed pair keep holding. Shared by the 3x3 corner and middle-edge phases
 * and the 2x2 bottom layer, which differ only in pairs, predicate and triggers.
 */
function placePieces(
  cube: Cube,
  pairs: ReadonlyArray<readonly [Face, Face]>,
  placed: (c: Cube, s1: Face, s2: Face) => boolean,
  baseGoal: (c: Cube) => boolean,
  triggers: Move[][],
): Move[] {
  let state = cube
  const all: Move[] = []
  for (const [s1, s2] of pairs) {
    if (placed(state, s1, s2)) continue
    const prior = pairs.filter(([a, b]) => placed(state, a, b))
    const goal = (c: Cube) =>
      baseGoal(c) && prior.every(([a, b]) => placed(c, a, b)) && placed(c, s1, s2)
    const moves = solveWithAlgs(state, triggers, goal, 5)
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  return all
}

export function solveFirstLayerCorners(cube: Cube): Move[] {
  return placePieces(cube, CORNER_PAIRS, cornerPlaced, crossDone, CORNER_TRIGGERS)
}

export function solveMiddleLayer(cube: Cube): Move[] {
  return placePieces(cube, CORNER_PAIRS, middleEdgePlaced, firstLayerDone, MIDDLE_TRIGGERS)
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

/** Reference color of each face, anchored on the corner currently at DBL. */
function frame2(cube: Cube): Record<Face, Color> {
  const dbl = cube.find((c) => c.position[0] === -1 && c.position[1] === -1 && c.position[2] === -1)
  if (!dbl) throw new Error('frame2: no corner at DBL')
  const d = colorAt(dbl, 'D')
  const l = colorAt(dbl, 'L')
  const b = colorAt(dbl, 'B')
  if (!d || !l || !b) throw new Error('frame2: DBL corner is missing stickers')
  return { D: d, L: l, B: b, U: OPPOSITE_COLOR[d], R: OPPOSITE_COLOR[l], F: OPPOSITE_COLOR[b] }
}

/** The three bottom corners to place around the DBL anchor (which is the BL one). */
const BOTTOM_PAIRS_2: ReadonlyArray<readonly [Face, Face]> = [
  ['L', 'F'],
  ['F', 'R'],
  ['R', 'B'],
]

function bottomCornerPlaced2(cube: Cube, s1: Face, s2: Face): boolean {
  return cornerPlacedIn(cube, frame2(cube), s1, s2)
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
  return placePieces(cube, BOTTOM_PAIRS_2, bottomCornerPlaced2, () => true, CORNER_TRIGGERS)
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

/** The 24 orientations of a solved 2x2 with their DBL frames, computed once. */
const SOLVED_2 = cubeOrientations(solvedCube('2')).map((c) => ({ cube: c, frame: frame2(c) }))

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
  const g = frame2(cube)
  const target = SOLVED_2.find(({ frame: f }) => f.D === g.D && f.L === g.L && f.B === g.B)?.cube
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
          // Key first: most children are already-visited duplicates, so the
          // move-list copy below is only built for meets and fresh states.
          const key = stateKey(state)
          const met = other.visited.get(key)
          const fresh = !expand.visited.has(key)
          if (!met && !fresh) continue
          const moves = [...node.moves, { face, amount: amount as 1 | 2 | 3 }]
          if (met && (!best || moves.length + met.length < best.length)) {
            const [f, b] = expand === fwd ? [moves, met] : [met, moves]
            best = [...f, ...invertMoves(b)]
          }
          if (fresh) {
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

/** The seven classic stages of the beginner "layer by layer" 3x3 method. */
const BEGINNER_SPECS: readonly StepSpec[] = [
  { key: 'stepBottomCross', phases: [solveCross] },
  { key: 'stepBottomCorners', phases: [solveFirstLayerCorners] },
  { key: 'stepMiddle', phases: [solveMiddleLayer] },
  { key: 'stepTopCross', phases: [solveTopCross] },
  { key: 'stepOrientCorners', phases: [solveTopFace] },
  { key: 'stepPermuteCorners', phases: [solvePermuteCorners] },
  { key: 'stepPermuteEdges', phases: [solvePermuteEdges] },
]

/** The four CFOP (Fridrich) stages: Cross, F2L, OLL, PLL. */
const CFOP_SPECS: readonly StepSpec[] = [
  { key: 'stepCross', phases: [solveCross] },
  { key: 'stepF2L', phases: [solveF2L] },
  { key: 'stepOLL', phases: [solveTopCross, solveTopFace] },
  { key: 'stepPLL', phases: [solvePermuteCorners, solvePermuteEdges] },
]

/** Beginner "layer by layer" method, taught as its seven classic stages. */
function beginnerSteps(cube: Cube): SolveStep[] {
  return buildSteps(cube, BEGINNER_SPECS)
}

/** CFOP (Fridrich), taught as its four stages: Cross, F2L, OLL, PLL. */
function cfopSteps(cube: Cube): SolveStep[] {
  return buildSteps(cube, CFOP_SPECS)
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

// ---------------------------------------------------------------------------
// 1x2x3 solver (optimal)
// ---------------------------------------------------------------------------

/** The four half turns of a 1x2x3 (its thin axis has no move of its own). */
const MOVES_123 = movesFor('123')

/** Depth that exhausts the 1x2x3: its reachable states all sit within 6 half
 *  turns of solved (asserted in the tests), so 7 proves a cube impossible. */
const MAX_DEPTH_123 = 7

/**
 * Shortest solution of a 1x2x3, by plain breadth-first search: every move is
 * a half turn and the reachable space is tiny, so the whole thing is explored
 * in a blink and the first hit is optimal. Any orientation of a solved puzzle
 * counts (a cuboid has no fixed center to anchor a frame). Throws once the
 * depth is exhausted, which is what validation needs to reject an impossible
 * puzzle.
 */
export function solveFlat123(cube: Cube): Move[] {
  if (isSolved(cube)) return []
  let frontier: Array<{ cube: Cube; moves: Move[] }> = [{ cube, moves: [] }]
  const seen = new Set<string>([stateKey(cube)])
  for (let depth = 0; depth < MAX_DEPTH_123; depth++) {
    const next: typeof frontier = []
    for (const node of frontier) {
      for (const move of MOVES_123) {
        const turned = applyMove(node.cube, move)
        const key = stateKey(turned)
        if (seen.has(key)) continue
        const moves = [...node.moves, move]
        if (isSolved(turned)) return moves
        seen.add(key)
        next.push({ cube: turned, moves })
      }
    }
    frontier = next
  }
  throw new Error('solveFlat123: no solution within the search depth')
}

/** 1x2x3 optimal solution, as a single step. */
function optimal123Steps(cube: Cube): SolveStep[] {
  return buildSteps(cube, [{ key: 'stepOptimal', phases: [solveFlat123] }])
}

/** 4x4 reduction: centers, edge pairing, parities, then a 3x3 finish. */
const reduction4Steps = reductionSteps(BEGINNER_SPECS)
const reductionCfop4Steps = reductionSteps(CFOP_SPECS)

/** Identifier of an available solving method. */
export type MethodId = 'beginner' | 'cfop' | 'optimal' | 'reduction' | 'reductionCfop'

/**
 * Registry of solving methods: one solver per supported shape, so which shapes
 * a method handles - and how - is declared in a single place.
 */
const SOLVE_METHODS: ReadonlyArray<{
  id: MethodId
  solvers: Readonly<Partial<Record<CubeShape, (cube: Cube) => SolveStep[]>>>
}> = [
  { id: 'beginner', solvers: { '2': beginner2Steps, '3': beginnerSteps } },
  { id: 'cfop', solvers: { '3': cfopSteps } },
  { id: 'reduction', solvers: { '4': reduction4Steps } },
  { id: 'reductionCfop', solvers: { '4': reductionCfop4Steps } },
  { id: 'optimal', solvers: { '2': optimalSteps, '123': optimal123Steps } },
]

/** The solving methods available for a given shape, each bound to it. */
export function methodsFor(shape: CubeShape) {
  return SOLVE_METHODS.flatMap((m) => {
    const solve = m.solvers[shape]
    return solve ? [{ id: m.id, solve }] : []
  })
}

/**
 * Default full solve, kept for validation and callers. Every branch throws on
 * an unsolvable cube after a bounded search, which is what validate.ts needs.
 */
export function solve(cube: Cube): Move[] {
  const shape = cubeShape(cube)
  if (shape === '2') return solveOptimal2(cube)
  if (shape === '123') return solveFlat123(cube)
  if (shape === '4') return reduction4Steps(cube).flatMap((s) => [...s.moves])
  return beginnerSteps(cube).flatMap((s) => [...s.moves])
}
