import { AXIS_ROTATIONS, FACE_NORMAL, faceOfNormal } from '../../core/geometry'
import { parseMoves } from '../../core/moves'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import { homesOf } from '../../core/pieces'
import { solvePieces } from '../../solve/pieceSearch'
import { isSolved, solvedCube } from '../../core/cube'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'

/**
 * Quarter Cube, "edges first", as taught on fan2cube.fr (quarter2). Every
 * face only goes a quarter and back, so every formula alternates on each
 * face it turns; played from START (every face where its clockwise quarter
 * goes), it leaves them all there again.
 *
 *   0. START   every face brought back where it turns clockwise
 *   1. Edges   placed by the 3-cycle A[DH]A' (HP) -> (HA) -> (HD)
 *   2. Flip    turned two at a time by A[DH]A'.G[HA]G'.D[HP]D'
 *   3. Corners placed by the 3-cycle [DH].G[HD]G' = [[DH], G]
 *   4. Twist   turned two at a time by [DH]².G[HD]²G' = [[DH]², G]
 *
 * Each formula from every way of holding the cube, and set up by a face's
 * quarter (undone after): those that alternate on every face, from START.
 * Notation (page -> app): H B A P G D = U D F B L R, [X Y] = X Y X' Y'.
 * Each formula's effect is asserted in tests/unit/puzzles/twisted/quarter.test.ts.
 */

/** 1: A[DH]A' */
export const EDGE_CYCLE = parseMoves("F R U R' U' F'")
/** 2: A[DH]A'.G[HA]G'.D[HP]D' */
export const EDGE_FLIP = parseMoves("F R U R' U' F' L U F U' F' L' R U B U' B' R'")
/** 3: [DH].G[HD]G' */
export const CORNER_CYCLE = parseMoves("R U R' U' L U R U' R' L'")
/** 4: [DH]².G[HD]²G' */
export const CORNER_TWIST = parseMoves("R U R' U' R U R' U' L U R U' R' U R U' R' L'")

const SOLVED = solvedCube('quarter')

/** Whether a sequence alternates on every face from START and ends there. */
function alternates(moves: readonly Move[]): boolean {
  const turned = new Set<Face>()
  for (const m of moves) {
    if (m.amount === 2 || turned.has(m.face) !== (m.amount === 3)) return false
    if (m.amount === 1) turned.add(m.face)
    else turned.delete(m.face)
  }
  return turned.size === 0
}

/** A formula held every way, and set up by a face's quarter: those that
 *  alternate. */
function variants(formula: readonly Move[]): Move[][] {
  const held = AXIS_ROTATIONS.map((turn) =>
    formula.map((m) => ({ ...m, face: faceOfNormal(turn(FACE_NORMAL[m.face])) })),
  )
  const faces = Object.keys(FACE_NORMAL) as Face[]
  const all = held.flatMap((f) => [
    f,
    ...faces.map((x): Move[] => [{ face: x, amount: 1 }, ...f, { face: x, amount: 3 }]),
  ])
  const seen = new Set<string>()
  return all.filter((f) => {
    const key = f.map((m) => m.face + m.amount).join()
    if (seen.has(key) || !alternates(f)) return false
    seen.add(key)
    return true
  })
}

let MACROS: Record<'edges' | 'flip' | 'corners' | 'twist', Move[][]> | undefined
const macros = () =>
  (MACROS ??= {
    edges: variants(EDGE_CYCLE),
    flip: variants(EDGE_FLIP),
    corners: variants(CORNER_CYCLE),
    twist: variants(CORNER_TWIST),
  })

const isEdge = (c: Cubie) => c.stickers.length === 2
const isCorner = (c: Cubie) => c.stickers.length === 3
const EDGES = homesOf('quarter', isEdge)
const CORNERS = homesOf('quarter', isCorner)
const key = (p: Vec3) => p.join()
const HOME = new Map(
  SOLVED.map((c) => [
    c.stickers
      .map((s) => s.color)
      .sort()
      .join(),
    c,
  ]),
)

/** A piece in its slot, whichever way round. */
const placed = (c: Cubie) =>
  key(
    HOME.get(
      c.stickers
        .map((s) => s.color)
        .sort()
        .join(),
    )!.position,
  ) === key(c.position)
/** A piece in its slot, the right way round. */
const home = (c: Cubie) => {
  const h = HOME.get(
    c.stickers
      .map((s) => s.color)
      .sort()
      .join(),
  )!
  return (
    key(h.position) === key(c.position) &&
    h.stickers.every((s) =>
      c.stickers.some((x) => x.color === s.color && key(x.normal) === key(s.normal)),
    )
  )
}

const NONE = moveSet('')

/** One piece after another of `homes`, each by the fewest formulas keeping
 *  those done (`done` says what done means). */
function oneByOne(
  homes: readonly Vec3[],
  formulas: () => Move[][],
  done: (c: Cubie) => boolean,
  step = 1,
) {
  return (cube: Cube): Move[] => {
    let state = cube
    const all: Move[] = []
    const count = (pieces: readonly Cubie[]) => pieces.filter(done).length
    for (let guard = 0; guard < homes.length; guard++) {
      const tracked = state.filter((c) => homes.some((h) => key(h) === key(c.position)))
      const now = count(tracked)
      if (now === homes.length) break
      const want = Math.min(homes.length, now + step)
      const moves = solvePieces(state, {
        track: homes,
        moves: NONE,
        macros: formulas(),
        goal: (pieces) => count(pieces) >= want,
        maxDepth: 3,
      })
      state = applyMoves(state, moves)
      all.push(...moves)
    }
    return all
  }
}

const atStart = (cube: Cube) => cube.every((c) => !c.spin)
const edgesPlaced = (cube: Cube) => atStart(cube) && cube.filter(isEdge).every(placed)
const edgesDone = (cube: Cube) => atStart(cube) && cube.filter(isEdge).every(home)
const cornersPlaced = (cube: Cube) => edgesDone(cube) && cube.filter(isCorner).every(placed)

/** 0: every face back where it turns clockwise. */
const toStart = (cube: Cube): Move[] =>
  cube.flatMap((c): Move[] =>
    c.spin ? [{ face: faceOfNormal(c.stickers[0]!.normal), amount: 3 }] : [],
  )

const ALL = allTurnsOf('quarter')

export const QUARTER_PLAN: MethodPlan = [
  { key: 'stepQuarterStart', goal: atStart, moves: ALL, phases: [toStart] },
  {
    key: 'stepQuarterEdges',
    goal: edgesPlaced,
    moves: ALL,
    phases: [oneByOne(EDGES, () => macros().edges, placed)],
  },
  {
    key: 'stepQuarterFlip',
    goal: edgesDone,
    moves: ALL,
    phases: [oneByOne(EDGES, () => macros().flip, home, 2)],
  },
  {
    key: 'stepQuarterCorners',
    goal: cornersPlaced,
    moves: ALL,
    phases: [oneByOne(CORNERS, () => macros().corners, placed)],
  },
  {
    key: 'stepQuarterTwist',
    goal: isSolved,
    moves: ALL,
    phases: [oneByOne(CORNERS, () => macros().twist, home, 1)],
  },
]
