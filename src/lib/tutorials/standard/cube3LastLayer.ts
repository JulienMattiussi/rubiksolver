import { FACE_COLOR, isSolved } from '../../core/cube'
import { FACE_NORMAL } from '../../core/geometry'
import { CUBE_HOLDS, type Hold } from '../../core/hold'
import { parseMoves } from '../../core/moves'
import { colorAt, hasColors } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Cube, Face, Move, Vec3 } from '../../core/types'
import { homeOf } from '../../methods/standard/pieces3'
import type { FigureStage } from '../../teach/kit'

/**
 * The 3x3 tutorial's last layer, the white one on top, by figures (no piece
 * picked: the figure the top shows says how to hold the puzzle and what to
 * play):
 *   4. the white cross: its edges turned white up by `F R U R' U' F'`,
 *      from a dot, an L held back left, a line held across;
 *   5. the white edges placed, each above its center: the top turned to
 *      line up the most, then `R U R' U R U2 R'` held the way they ask;
 *   6. the white corners placed, turned anyhow: one already in its place
 *      held front right, then `U R U' L' U R' U' L`;
 *   7. the white corners turned, white up: each held front right, `R' D'
 *      R D` until its white is up, then `U` to the next; the first layer
 *      comes apart on the way and back at the end, so it is one step.
 * Each formula keeps the first two layers (the last, once it is over).
 */

const W = FACE_COLOR.U

/** The sides round the top: a cube's holds, each a face. */
const SIDES = CUBE_HOLDS.holds as readonly Face[]

const sameAt = (a: Vec3, b: Vec3) => a.join() === b.join()

const at = (cube: Cube, where: Vec3) => cube.find((c) => sameAt(c.position, where))!

/** A turn of the top, `amount` quarters (none: no move). */
const topTurn = (amount: number): Move[] =>
  amount % 4 === 0 ? [] : [{ face: 'U', amount: (amount % 4) as 1 | 2 | 3 }]

/** The top layer's edges (2 stickers) or corners (3). */
const topPieces = (cube: Cube, stickers: number) =>
  cube.flatMap((c, i) => (c.stickers.length === stickers && c.position[1] === 1 ? [i] : []))

/** A formula read in a hold, as played. */
const played = (hold: Hold, moves: readonly Move[]) => moves.map((m) => CUBE_HOLDS.played(hold, m))

// ---------------------------------------------------------------------------
// 4. The white cross
// ---------------------------------------------------------------------------

/** The top edge on a side (read in a hold), if it shows white up. */
const whiteUp = (cube: Cube, hold: Hold, side: Face) =>
  colorAt(at(cube, homeOf(`U${CUBE_HOLDS.faceAt(hold, side)}`)), 'U') === W

/** The white cross's one formula: a line becomes the cross, an L a line,
 *  a dot an L. */
const TOP_CROSS = parseMoves("F R U R' U' F'")

/** A figure of the white cross, which sides show white up (front, right,
 *  back, left), seen from the first hold that shows it. */
const topCrossFigure = (key: string, figure: readonly [boolean, boolean, boolean, boolean]) => ({
  key,
  match: (cube: Cube) => {
    const hold = SIDES.find((h) =>
      (['F', 'R', 'B', 'L'] as const).every((side, i) => whiteUp(cube, h, side) === figure[i]),
    )
    return hold ? { hold, moves: TOP_CROSS } : null
  },
})

/** The top edges showing white up. */
const whiteEdgesUp = (cube: Cube) =>
  cube.flatMap((c, i) =>
    c.stickers.length === 2 && c.position[1] === 1 && colorAt(c, 'U') === W ? [i] : [],
  )

const TOP_CROSS_STAGE: FigureStage = {
  kind: 'figures',
  side: FACE_NORMAL.U,
  // The white cross, shown done.
  shows: FACE_NORMAL.U,
  key: 'stepTutorialTopCross',
  stage: 4,
  done: (cube) => whiteEdgesUp(cube).length === 4,
  figures: [
    topCrossFigure('figureLine', [false, true, false, true]),
    topCrossFigure('figureL', [false, false, true, true]),
    topCrossFigure('figureDot', [false, false, false, false]),
  ],
  // The edges moved, an arrow each following its white.
  subjects: (cube) => topPieces(cube, 2),
  marker: W,
  progress: (cube) => ({ done: whiteEdgesUp(cube).length, total: 4 }),
  algorithms: [[TOP_CROSS]],
}

// ---------------------------------------------------------------------------
// 5. The white edges placed
// ---------------------------------------------------------------------------

/** The top edges above the center of their color. */
const edgesHome = (cube: Cube) =>
  SIDES.flatMap((side) => {
    const i = cube.indexOf(at(cube, homeOf(`U${side}`)))
    return colorAt(cube[i]!, side) === FACE_COLOR[side] ? [i] : []
  })

/** The most top edges a turn of the top lines up, and that turn. */
function lineUp(cube: Cube): { home: number; turn: number } {
  return [0, 1, 2, 3]
    .map((turn) => ({ home: edgesHome(applyMoves(cube, topTurn(turn))).length, turn }))
    .reduce((best, t) => (t.home > best.home ? t : best))
}

const EDGES = parseMoves("R U R' U R U2 R'")

/**
 * The white edges' formula: of the holds and turns of the top before it,
 * the one lining up the most edges after it (all, if it can, with the turn
 * of the top that does); just a turn of the top when that already does.
 */
function edgesFormula(cube: Cube): { hold: Hold; moves: Move[]; home: number } {
  const now = lineUp(cube)
  if (now.home === 4) return { hold: 'F', moves: topTurn(now.turn), home: 4 }
  let best = { hold: 'F' as Hold, moves: [] as Move[], home: -1 }
  for (const before of [0, 1, 2, 3]) {
    for (const hold of SIDES) {
      const moves = [...topTurn(before), ...EDGES]
      const after = lineUp(applyMoves(cube, played(hold, moves)))
      if (after.home > best.home) {
        best = {
          hold,
          moves: [...moves, ...(after.home === 4 ? topTurn(after.turn) : [])],
          home: after.home,
        }
      }
    }
  }
  return best
}

/** A figure of the white edges, by how many a turn of the top lines up
 *  (and whether two side by side or facing). */
const edgesFigure = (key: string, fits: (cube: Cube) => boolean) => ({
  key,
  match: (cube: Cube) => (fits(cube) ? edgesFormula(cube) : null),
})

/** Whether the two edges a turn lines up stand side by side. */
const sideBySide = (cube: Cube) => {
  const lined = applyMoves(cube, topTurn(lineUp(cube).turn))
  const home = edgesHome(lined).map((i) => lined[i]!.position)
  return home.length === 2 && home[0]![0] !== -home[1]![0]
}

const TOP_EDGES_STAGE: FigureStage = {
  kind: 'figures',
  side: FACE_NORMAL.U,
  key: 'stepTutorialTopEdges',
  stage: 5,
  done: (cube) => edgesHome(cube).length === 4,
  figures: [
    edgesFigure('figureEdgesTurn', (cube) => lineUp(cube).home === 4),
    edgesFigure('figureEdgesSide', (cube) => lineUp(cube).home === 2 && sideBySide(cube)),
    edgesFigure('figureEdgesFacing', () => true),
  ],
  subjects: (cube) => topPieces(cube, 2),
  progress: (cube) => ({ done: edgesHome(cube).length, total: 4 }),
  algorithms: [[EDGES]],
}

// ---------------------------------------------------------------------------
// 6. The white corners placed
// ---------------------------------------------------------------------------

/** The top corners in their place, turned anyhow. */
const cornersHome = (cube: Cube) =>
  SIDES.flatMap((side, k) => {
    const next = SIDES[(k + 1) % 4]!
    const i = cube.indexOf(at(cube, homeOf(`U${side}${next}`)))
    return hasColors(cube[i]!, [W, FACE_COLOR[side], FACE_COLOR[next]]) ? [i] : []
  })

const CORNERS = parseMoves("U R U' L' U R' U' L")

/** The white corners' formula: held with a corner in its place front right
 *  (it stays, the three others go round), once or twice. */
function cornersFormula(cube: Cube): { hold: Hold; moves: Move[] } {
  let best = { hold: 'F' as Hold, moves: CORNERS, home: -1 }
  for (const hold of SIDES) {
    for (const times of [1, 2]) {
      const moves = Array.from({ length: times }, () => CORNERS).flat()
      const home = cornersHome(applyMoves(cube, played(hold, moves))).length
      if (home > best.home) best = { hold, moves, home }
    }
  }
  return best
}

const TOP_CORNERS_STAGE: FigureStage = {
  kind: 'figures',
  side: FACE_NORMAL.U,
  key: 'stepTutorialTopCorners',
  stage: 6,
  done: (cube) => cornersHome(cube).length === 4,
  figures: [
    {
      key: 'figureCornersOne',
      match: (cube) => (cornersHome(cube).length > 0 ? cornersFormula(cube) : null),
    },
    { key: 'figureCornersNone', match: (cube) => cornersFormula(cube) },
  ],
  subjects: (cube) => topPieces(cube, 3),
  progress: (cube) => ({ done: cornersHome(cube).length, total: 4 }),
  algorithms: [[CORNERS]],
}

// ---------------------------------------------------------------------------
// 7. The white corners turned
// ---------------------------------------------------------------------------

const TWIST = parseMoves("R' D' R D")

/** The top corners showing white up. */
const cornersUp = (cube: Cube) =>
  cube.flatMap((c, i) =>
    c.stickers.length === 3 && c.position[1] === 1 && colorAt(c, 'U') === W ? [i] : [],
  )

/** The corners turned, one after the other at the front right: `R' D' R D`
 *  until its white is up, the top turned to the next one to turn. */
function twistFormula(start: Cube): Move[] {
  const moves: Move[] = []
  // The state the moves so far lead to, and the turns of the top looked
  // past since (played only once a corner there needs turning).
  let cube = start
  let turns = 0
  const corner = () => at(applyMoves(cube, topTurn(turns)), homeOf('URF'))
  for (let k = 0; k < 4; k++, turns++) {
    if (colorAt(corner(), 'U') === W) continue
    const lead = topTurn(turns)
    moves.push(...lead)
    cube = applyMoves(cube, lead)
    turns = 0
    for (let n = 0; n < 6 && colorAt(corner(), 'U') !== W; n++) {
      moves.push(...TWIST)
      cube = applyMoves(cube, TWIST)
    }
  }
  // The top turned back where it belongs.
  const back = [0, 1, 2, 3].find((t) => isSolved(applyMoves(cube, topTurn(t)))) ?? 0
  return [...moves, ...topTurn(back)]
}

const TOP_TWIST_STAGE: FigureStage = {
  kind: 'figures',
  side: FACE_NORMAL.U,
  key: 'stepTutorialTopTwist',
  stage: 7,
  done: isSolved,
  figures: [
    { key: 'figureCornersTwist', match: (cube) => ({ hold: 'F', moves: twistFormula(cube) }) },
  ],
  focus: (cube) =>
    cube.flatMap((c, i) =>
      c.stickers.length === 3 && c.position[1] === 1 && colorAt(c, 'U') !== W ? [i] : [],
    ),
  progress: (cube) => ({ done: cornersUp(cube).length, total: 4 }),
  algorithms: [[TWIST]],
}

/** The last layer's stages, in order. */
export const LAST_LAYER: readonly FigureStage[] = [
  TOP_CROSS_STAGE,
  TOP_EDGES_STAGE,
  TOP_CORNERS_STAGE,
  TOP_TWIST_STAGE,
]
