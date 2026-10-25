import { CUBE_HOLDS } from '../../core/hold'
import { colorsOf } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import { parseMoves } from '../../core/notation'
import type { Cube, Cubie } from '../../core/types'
import { tutorialOf, type Target } from '../../teach/kit'
import { perState } from '../../teach/macros'
import type { FigureStage, PieceStage } from '../../teach/stages'
import { FIRST_LAYERS, holdStage } from './cube3'
import {
  canonical,
  count,
  eachWay,
  isCorner,
  isEdge,
  isMiddleEdge,
  isWhite,
  isYellow,
  keeps,
  leadOf,
  playedOf,
  readPlaced,
  TOP_TURNS,
  wayChain,
  wayFigures,
  wayGuide,
  type Placed,
  type Way,
} from './crossCornersKit'
import { CENTER, CLOCKWISE, CORNER, COUNTERCLOCKWISE, EDGE, THICKNESSES } from './terms'

/**
 * The 3x3's tutorial "cross then corners": every edge, then every corner,
 * each step by one formula played with the cube held whichever way brings
 * its pieces where the formula takes them (crossCornersKit.ts):
 *   1. the yellow cross, as the beginner's;
 *   2. the middle edges, by `F U R U' R' F' U'` (the top's front and left
 *      edges swapped), played once or twice in a row (twice: those two
 *      turned over in place), the top turned at will meanwhile;
 *   3. the top's edges, by the same formula, the top up;
 *   4. the bottom's corners in their places, turned anyhow, by
 *      `L' F R F' L F R' F'` (three corners of the front cycled);
 *   5. the top's corners in their places, by the same formula (held with
 *      the top in front: it cycles three of its corners, the bottom kept);
 *   6. every corner turned, by `R U2 R' U' R U' R' L' U2 L U L' U L` (the
 *      top's two corners on the right turned, each its own way).
 */

const SWAP = parseMoves("F U R U' R' F' U'")
const SWAP_TWICE = [...SWAP, ...SWAP]
const CYCLE = parseMoves("L' F R F' L F R' F'")
const TWIST = parseMoves("R U2 R' U' R U' R' L' U2 L U L' U L")

const crossEdge = (c: Cubie) => isEdge(c) && isYellow(c)
const lowEdge = (c: Cubie) => isEdge(c) && !isWhite(c)
const yellowCorner = (c: Cubie) => isCorner(c) && isYellow(c)

/** The indices of the pieces a step works on: moved, each its arrow (none
 *  hatched). */
const indicesOf = (cube: Cube, which: (c: Cubie) => boolean) =>
  cube.flatMap((c, i) => (which(c) ? [i] : []))

const all = (placed: Placed, test: 'home' | 'inCell') =>
  count(placed, test) === placed.pieces.length
const edgesHome = (cube: Cube) => all(readPlaced(cube, isEdge), 'home')

/** A stage played by chains of ways, its steps read on the cube with its
 *  centers home: each its first way, its arrows on the side it works on. */
const wayStage = (
  key: string,
  stage: number,
  chainOf: (cube: Cube) => Way[] | null,
  figures: Record<string, string>,
  rest: Pick<FigureStage, 'done' | 'progress' | 'subjects' | 'algorithms' | 'focus'>,
): FigureStage => {
  const lead = leadOf(chainOf)
  return {
    kind: 'figures',
    key,
    stage,
    figures: wayFigures(lead, figures),
    side: (cube) => lead(cube)?.side,
    ...rest,
  }
}

// ---------------------------------------------------------------------------
// 2-3. The edges
// ---------------------------------------------------------------------------

const EDGE_FIGURES = {
  top: 'figureCrossCornersTop',
  swap: 'figureCrossCornersSwap',
  swapTwice: 'figureCrossCornersSwapTwice',
  topSwap: 'figureCrossCornersTopSwap',
  topSwapTwice: 'figureCrossCornersTopSwapTwice',
}

/** The swap once or twice, the cross kept: from any side up. */
const SWAPS = [...eachWay('swap', SWAP), ...eachWay('swapTwice', SWAP_TWICE)].filter((w) =>
  keeps(w, crossEdge),
)

/** One more middle edge in its place (turned anyhow), then, all four
 *  there, one more turned right: the fewest swaps, the top turned at will,
 *  the cross kept and never fewer of them so on the way (each formula
 *  played brings one more nearer, never back; one may turn over a middle
 *  edge on its way). */
const middleChain = perState((cube: Cube) => {
  const now = readPlaced(cube, isMiddleEdge)
  const test = count(now, 'inCell') < 4 ? 'inCell' : 'home'
  const before = count(now, test)
  const crossKept = (p: Placed) => p.pieces.every((c, j) => !crossEdge(c) || p.home(j))
  const middle = (p: Placed) => count(p, test, isMiddleEdge)
  // The top's turns first: between chains as short, the one bringing an
  // edge round by a turn of the top rather than by the formula.
  return wayChain(cube, [...TOP_TURNS, ...SWAPS], lowEdge, (p) => middle(p) > before, {
    depth: 5,
    through: (p) =>
      crossKept(p) &&
      middle(p) >= before &&
      (test === 'inCell' || count(p, 'inCell', isMiddleEdge) === 4),
  })
})

const MIDDLE = wayStage('stepTutorialCrossCornersMiddle', 2, middleChain, EDGE_FIGURES, {
  done: (cube) => all(readPlaced(cube, lowEdge), 'home'),
  // In their cells, even turned over: a count that never goes down.
  progress: (cube) => ({ done: count(readPlaced(cube, isMiddleEdge), 'inCell'), total: 4 }),
  subjects: (cube) => indicesOf(cube, isMiddleEdge),
  algorithms: [[SWAP]],
})

const TOP_SWAPS = [
  ...eachWay('swap', SWAP, { ups: ['U'] }),
  ...eachWay('swapTwice', SWAP_TWICE, { ups: ['U'] }),
]
const topEdge = (c: Cubie) => isEdge(c) && isWhite(c)

const topEdgesChain = perState((cube: Cube) =>
  wayChain(cube, [...TOP_TURNS, ...TOP_SWAPS], isEdge, (p) => all(p, 'home')),
)

const TOP_EDGES = wayStage('stepTutorialCrossCornersTopEdges', 3, topEdgesChain, EDGE_FIGURES, {
  done: edgesHome,
  progress: (cube) => ({ done: count(readPlaced(cube, topEdge), 'home'), total: 4 }),
  subjects: (cube) => indicesOf(cube, topEdge),
  algorithms: [[SWAP]],
})

// ---------------------------------------------------------------------------
// 4-6. The corners
// ---------------------------------------------------------------------------

const CYCLES = eachWay('cycle', CYCLE, { on: 'F' })
const CORNER_FIGURES = { cycle: 'figureCrossCornersCycle' }

const inCells = (cube: Cube, which: (c: Cubie) => boolean) =>
  edgesHome(cube) && all(readPlaced(cube, which), 'inCell')

/** One more of some corners (`which`, among those followed) in its cell,
 *  never fewer on the way, the cube kept as `keep` says (so that each
 *  formula played brings one more nearer, never back); failing that, all
 *  of them at once. */
const oneMoreCorner = (
  cube: Cube,
  track: (c: Cubie) => boolean,
  which: (c: Cubie) => boolean,
  keep: (p: Placed) => boolean = () => true,
) => {
  const before = count(readPlaced(cube, which), 'inCell')
  const placed = (p: Placed) => count(p, 'inCell', which)
  return (
    wayChain(cube, CYCLES, track, (p) => placed(p) > before, {
      cells: true,
      through: (p) => keep(p) && placed(p) >= before,
    }) ?? wayChain(cube, CYCLES, track, (p) => all(p, 'inCell'), { cells: true, through: keep })
  )
}

const bottomChain = perState((cube: Cube) => oneMoreCorner(cube, yellowCorner, yellowCorner))

const BOTTOM_CORNERS = wayStage('stepTutorialCrossCornersBottom', 4, bottomChain, CORNER_FIGURES, {
  done: (cube) => inCells(cube, yellowCorner),
  progress: (cube) => ({ done: count(readPlaced(cube, yellowCorner), 'inCell'), total: 4 }),
  subjects: (cube) => indicesOf(cube, yellowCorner),
  algorithms: [[CYCLE]],
})

const topCorner = (c: Cubie) => isCorner(c) && isWhite(c)

/** The bottom corners kept in their places all the way (the formula held
 *  with the top in front cycles the top's corners only). */
const topChain = perState((cube: Cube) =>
  oneMoreCorner(cube, isCorner, topCorner, (p) =>
    p.pieces.every((c, j) => !isYellow(c) || p.inCell(j)),
  ),
)

const TOP_CORNERS = wayStage('stepTutorialCrossCornersTop', 5, topChain, CORNER_FIGURES, {
  done: (cube) => inCells(cube, isCorner),
  progress: (cube) => ({ done: count(readPlaced(cube, topCorner), 'inCell'), total: 4 }),
  subjects: (cube) => indicesOf(cube, topCorner),
  algorithms: [[CYCLE]],
})

/** The fewest twists turning every corner right, never fewer corners
 *  right from one to the next (a corner right turns only to bring another
 *  right): read on a cube, the best first one, or the best one turning a
 *  corner picked. */
const twistGuide = wayGuide(
  eachWay('twist', TWIST),
  isCorner,
  (from, to) => count(to, 'home') >= count(from, 'home'),
)
const twistFor = (cube: Cube, piece?: number) =>
  twistGuide(cube, piece === undefined ? undefined : colorsOf(cube[piece]!))

/** A corner, home when turned right (read with the centers home), in its
 *  place where it stands. */
const cornerTarget =
  (begun: Cube) =>
  (colors: string): Target => ({
    piece: (cube) => cube.findIndex((c) => colorsOf(c) === colors),
    slot: begun.find((c) => colorsOf(c) === colors)!.position,
    placed: (cube) => {
      const read = readPlaced(cube, (c) => colorsOf(c) === colors)
      return read.home(0)
    },
  })

const TWISTED: PieceStage = {
  kind: 'pieces',
  key: 'stepTutorialCrossCornersTwist',
  stage: 6,
  inPlace: true,
  // The corners the best twist turns right first: the one suggested.
  targets: (begun) => {
    const best = twistFor(begun)
    const turned = best ? playedOf(begun, best) : null
    const after =
      turned &&
      applyMoves(
        begun,
        turned.moves.map((m) => CUBE_HOLDS.played(turned.hold, m)),
      )
    const right = (cube: Cube) => (c: Cubie) =>
      readPlaced(cube, (d) => colorsOf(d) === colorsOf(c)).home(0)
    const first = begun.filter((c) => isCorner(c) && !right(begun)(c) && !!after && right(after)(c))
    const corners = [...first, ...begun.filter((c) => isCorner(c) && !first.includes(c))]
    return corners.map((c) => cornerTarget(begun)(colorsOf(c)))
  },
  hold: (begun, pick, next) => {
    const way = twistFor(begun, pick?.piece ?? next.piece(begun))
    return way ? playedOf(begun, way).hold : 'F'
  },
  formula: (cube, pick) => {
    const way = twistFor(cube, pick.piece)
    if (!way) return null
    const { hold, moves } = playedOf(cube, way)
    return moves.map((m) => CUBE_HOLDS.played(hold, m))
  },
  algorithms: [[TWIST]],
}

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

const CROSS = FIRST_LAYERS[0]!
const crossDone = (cube: Cube) => all(readPlaced(cube, crossEdge), 'home')

export const CROSS_CORNERS_TUTORIAL = tutorialOf({
  glossary: [CENTER, EDGE, CORNER, CLOCKWISE, COUNTERCLOCKWISE, ...THICKNESSES],
  stages: [
    // Not once the cross is built: the cube is turned in hand from then on.
    holdStage(crossDone),
    {
      ...CROSS,
      targets: (CROSS.targets as readonly Target[]).map((t) => ({
        ...t,
        placed: (cube: Cube) => t.placed(canonical(cube)),
      })),
    },
    MIDDLE,
    TOP_EDGES,
    BOTTOM_CORNERS,
    TOP_CORNERS,
    TWISTED,
  ],
})
