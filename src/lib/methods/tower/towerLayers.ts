import { faceColorsOf, isSolved, solvedCube } from '../../core/cube'
import { normalIndex, vecKey } from '../../core/geometry'
import { invertMoves } from '../../core/moves'
import { parseMoves } from '../../core/notation'
import { allTurnsOf, moveSet, type MoveSet } from '../../core/moveSet'
import { atHome, homesOf } from '../../core/pieces'
import { solvePieces } from '../../solve/pieceSearch'
import type { MethodPlan, StepSpec } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import { type Cube, type Cubie, type Move, type Vec3 } from '../../core/types'
import { SHAPE_SHIFTS, type CubeShape } from '../../core/shapes'
import {
  CYCLE_EDGES,
  DESCEND_CORNER,
  DESCEND_EDGE,
  DOMINO_PLAN,
  SWAP_CORNERS,
  SWAP_EDGES_BACK,
  SWAP_EDGES_RIGHT,
} from './domino'
import { byCycles, homesByColor, towerCycles } from './towerReduce'
import { once } from '../../solve/once'

/**
 * The towers as fan2cube.fr solves them once reduced (tower3342, and the
 * bigger ones after their reduction): Dominos stacked, a pair of layers
 * each, sharing their sides, and the middle layer of an odd height.
 *
 *   - The outer Domino (the top and bottom layers): read as a Domino
 *     (domino.ts), its pieces all unique.
 *   - An inner Domino (two layers in from them): the Domino's formulas on
 *     its layers, h and b for H and B. Its pieces go by twins (a top one and
 *     a bottom one alike), which take up any parity the outer one leaves.
 *     Its formulas also turn the sides, which the others share: each comes
 *     twice over, h or b turned between and back after (M S M S'; the sides
 *     of a Domino formula read the same both ways, so twice over they undo),
 *     or once if its sides already undo, as the page brings the pieces down
 *     "deux par deux".
 *   - The middle layer: its side edges with its own turn and that turn set
 *     up by the sides (s E s', the others back as they were), then its
 *     centers by pure 3-cycles.
 *
 * The page solves the inner Domino first: solved first, the outer one (its
 * pieces unique) would be left in a parity no formula keeping the inner one
 * undoes.
 */

/** Where some pieces stand and how they are turned, twins merged. */
const layoutKey = (pieces: readonly Cubie[]) =>
  pieces
    .map(
      (c) =>
        `${c.position.join(',')}:${c.stickers
          .map((s) => `${normalIndex(s.normal)}${s.color}`)
          .sort()
          .join('')}`,
    )
    .sort()
    .join(' ')

const height = (c: Cubie) => Math.abs(c.position[1])
const top = (shape: CubeShape) => Math.max(...solvedCube(shape).map(height))

/** Whether every piece `keep` selects is home. */
const homeAll = (shape: CubeShape, keep: (c: Cubie) => boolean) => (cube: Cube) =>
  cube.filter((c) => c.stickers.length && keep(c)).every((c) => atHome(c, shape))

const SIDES = 'R2 L2 F2 B2'

/** A tower that turns like a bigger cube (the 3x3x5 like a 5x5x5) turns
 *  its sides by blocks: a side's half turn is its block's, Rw2 for R2. */
const isSide = (m: Move) => m.face !== 'U' && m.face !== 'D'
const widen =
  (shape: CubeShape) =>
  (moves: readonly Move[]): Move[] =>
    SHAPE_SHIFTS[shape]
      ? moves.map((m) => (isSide(m) && !m.depth ? { ...m, depth: 2, wide: true } : m))
      : [...moves]
const sidesOf = (shape: CubeShape) => (SHAPE_SHIFTS[shape] ? 'Rw2 Lw2 Fw2 Bw2' : SIDES)

// ---------------------------------------------------------------------------
// The outer Domino
// ---------------------------------------------------------------------------

/**
 * The outer Domino as a Domino: its corners, an edge piece per edge (its
 * middle, else the one at +1 along it: once reduced, the others go with
 * it), two grid steps or more to one, and its centers (each a fixed color).
 */
function toDomino(shape: CubeShape): (cube: Cube) => Cube {
  const y = top(shape)
  const reach = Math.max(...solvedCube(shape).map((c) => Math.abs(c.position[0])))
  const faces = faceColorsOf(shape)
  const centers: Cube = [1, -1].map((s) => ({
    position: [0, s, 0],
    stickers: [{ normal: [0, s, 0], color: s > 0 ? faces.U : faces.D }],
  }))
  const along = (c: Cubie) => [c.position[0], c.position[2]].filter((v) => Math.abs(v) !== reach)
  const middles = solvedCube(shape).some(
    (c) => height(c) === y && c.stickers.length === 2 && along(c)[0] === 0,
  )
  const pick = (c: Cubie) =>
    height(c) === y &&
    c.stickers.length >= 2 &&
    (c.stickers.length === 3 || along(c)[0] === (middles ? 0 : 1))
  const scale = (v: number) => (Math.abs(v) === reach ? Math.sign(v) : 0)
  return (cube) => [
    ...cube.filter(pick).map((c) => ({
      ...c,
      position: [scale(c.position[0]), Math.sign(c.position[1]), scale(c.position[2])] as Vec3,
    })),
    ...centers,
  ]
}

/** The outer Domino's steps: its corners, then its edges. */
export function outerDomino(shape: CubeShape): StepSpec[] {
  const project = toDomino(shape)
  const wide = widen(shape)
  const steps = (key: string, specs: MethodPlan): StepSpec => ({
    key,
    goal: (cube) => specs[specs.length - 1]!.goal(project(cube)),
    moves: moveSet(`U D ${sidesOf(shape)}`),
    phases: specs.flatMap((spec) =>
      spec.phases.map((ph) => (cube: Cube) => wide(ph(project(cube)) as Move[])),
    ),
  })
  return [
    steps('stepOuterCorners', DOMINO_PLAN.slice(0, 2)),
    steps('stepOuterEdges', DOMINO_PLAN.slice(2)),
  ]
}

// ---------------------------------------------------------------------------
// An inner Domino
// ---------------------------------------------------------------------------

const EDGE_FORMULAS = [CYCLE_EDGES, SWAP_EDGES_RIGHT, SWAP_EDGES_BACK]
const both = (formulas: readonly (readonly Move[])[]) =>
  formulas.flatMap((f) => [[...f], invertMoves(f)])

/**
 * The steps of the inner Domino at height `y` (its layers turned as `depth`
 * from U and D): its corners, then its edges. Also used for the outer
 * layers (`y` the top) when every other layer must be kept.
 */
export function innerDomino(shape: CubeShape, y: number, depth: 1 | 2 | 3): StepSpec[] {
  const solved = solvedCube(shape)
  const inPair = (c: Cubie) => height(c) === y
  // On the outer layers (the Fashion-V's, kept from its equator), a piece
  // wears its top or bottom sticker too.
  const extra = y === top(shape) ? 1 : 0
  const isCorner = (c: Cubie) => inPair(c) && c.stickers.length === 2 + extra
  const isEdge = (c: Cubie) => inPair(c) && c.stickers.length === 1 + extra
  const isBottom = (c: Cubie) => c.position[1] < 0
  const isHome = (c: Cubie) => atHome(c, shape)
  const deep = depth === 1 ? {} : { depth }
  const prefix = depth === 1 ? '' : depth
  const layer = (face: 'U' | 'D', amount: 1 | 2 | 3): Move => ({ face, amount, ...deep })

  /** A Domino formula on these layers. */
  const inner = (moves: readonly Move[]): Move[] =>
    widen(shape)(moves.map((m) => (m.face === 'U' || m.face === 'D' ? { ...m, ...deep } : m)))
  /** Whether a sequence leaves every other layer as it is. */
  const othersKept = (moves: readonly Move[]) => {
    const after = applyMoves(solved, moves)
    return solved.every((c, i) => inPair(c) || layoutKey([c]) === layoutKey([after[i]!]))
  }
  const turns: Move[][] = ([0, 1, 2, 3] as const).flatMap((h) =>
    ([0, 1, 2, 3] as const).map((b) => [
      ...(h ? [layer('U', h)] : []),
      ...(b ? [layer('D', b)] : []),
    ]),
  )
  /** A formula the other layers do not see: itself if its sides undo, else
   *  twice over, these layers turned between and back after. */
  const unseen = (formula: readonly Move[]): Move[][] => {
    const f = inner(formula)
    const out = othersKept(f)
      ? [f]
      : turns.map((between) => [...f, ...between, ...f, ...invertMoves(between)])
    if (!out.every(othersKept)) throw new Error('towerLayers: a formula the other layers see')
    return out
  }

  /** A phase: the pieces at `goalOf` home (twins either way round), the
   *  tracked pieces placed under the formulas by these layers' turns. */
  const phase =
    (track: readonly Vec3[], formulas: readonly Move[][], goalOf: readonly Vec3[]) =>
    (cube: Cube): Move[] => {
      const goal = new Set(goalOf.map(vecKey))
      // The outer layers' pieces are each one of a kind: those to bring
      // home, all tracked and home, are one state, searched from both ends.
      const single = extra === 1
      return solvePieces(cube, {
        track: single ? goalOf : track,
        moves: moveSet(`${prefix}U ${prefix}D`),
        macros: formulas,
        ...(!single && {
          goal: (p: readonly Cubie[]) =>
            p.filter((c) => goal.has(vecKey(c.position)) && isHome(c)).length === goal.size,
          key: layoutKey,
        }),
        among: inPair,
        maxDepth: 12,
      })
    }

  const corners = homesOf(shape, isCorner)
  const bottomCorners = homesOf(shape, (c) => isCorner(c) && isBottom(c))
  const edges = homesOf(shape, (c) => isCorner(c) || isEdge(c))
  const bottomEdges = homesOf(shape, (c) => isCorner(c) || (isEdge(c) && isBottom(c)))
  const above = (c: Cubie) => height(c) > y
  const moves = moveSet(`${prefix}U ${prefix}D ${sidesOf(shape)}`)
  return [
    {
      key: extra ? 'stepOuterCorners' : 'stepInnerCorners',
      goal: homeAll(shape, (c) => above(c) || isCorner(c)),
      moves,
      phases: [
        phase(corners, both([DESCEND_CORNER]).flatMap(unseen), bottomCorners),
        phase(corners, both([SWAP_CORNERS]).flatMap(unseen), corners),
      ],
    },
    {
      key: extra ? 'stepOuterEdges' : 'stepInnerEdges',
      goal: homeAll(shape, (c) => height(c) >= y),
      moves,
      phases: [
        phase(edges, both([DESCEND_EDGE]).flatMap(unseen), bottomEdges),
        // The top ones with the bottom ones' formulas too: their twins
        // below take up a parity the top's alone cannot.
        phase(edges, both([DESCEND_EDGE, ...EDGE_FORMULAS]).flatMap(unseen), edges),
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// The middle layer
// ---------------------------------------------------------------------------

/**
 * The middle layer's steps, its turn being `turn` (2U on a 3-high tower, 3U
 * on a 5-high one): its side edges, then its centers. A 3-wide tower's
 * middle centers are one of each color and only go round together with
 * its turn: no 3-cycle moves them, they come home with the edges.
 */
export function middleLayer(shape: CubeShape, turn: string): StepSpec[] {
  const inMiddle = (c: Cubie) => c.position[1] === 0 && c.stickers.length > 0
  const isEdge = (c: Cubie) => inMiddle(c) && c.stickers.length === 2
  const isCenter = (c: Cubie) => inMiddle(c) && c.stickers.length === 1
  const isHome = (c: Cubie) => atHome(c, shape)
  const middle = parseMoves(turn)[0]!
  const amounts = ([1, 2, 3] as const).map((amount): Move => ({ ...middle, amount }))
  // Its turn set up by one or two sides, the sides undone after.
  const sides = parseMoves(sidesOf(shape))
  const setups = [...sides.map((s) => [s]), ...sides.flatMap((s) => sides.map((t) => [s, t]))]
  const macros = setups.flatMap((s) => amounts.map((m) => [...s, m, ...invertMoves(s)]))
  const edges = homesOf(shape, isEdge)
  const centerHomes = homesOf(shape, isCenter)
  const alone = centerHomes.length === 4
  const table = once(() => towerCycles(shape, isCenter, () => false, amounts))
  const centers = homesByColor(shape, isCenter, table)
  const moves: MoveSet = moveSet(`${turn} ${sidesOf(shape)}`)
  // Its centers' 3-cycles are set up by any turn.
  const all = [...allTurnsOf(shape).turns, ...amounts]
  return [
    {
      key: 'stepMiddleEdges',
      goal: alone ? isSolved : homeAll(shape, (c) => c.position[1] !== 0 || isEdge(c)),
      moves,
      phases: [
        (cube) =>
          solvePieces(cube, {
            track: alone ? [...edges, ...centerHomes] : edges,
            moves: moveSet(turn),
            macros,
            goal: (p) => p.every(isHome),
            key: layoutKey,
            among: inMiddle,
            maxDepth: 10,
          }),
      ],
    },
    ...(alone
      ? []
      : [
          {
            key: 'stepMiddleCenters',
            goal: isSolved,
            moves: { generators: all, turns: all },
            phases: [byCycles(table, centers)],
          },
        ]),
  ]
}
