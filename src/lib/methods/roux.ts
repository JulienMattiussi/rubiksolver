import { FACE_COLOR, isSolved } from '../cube'
import { moveSet, OUTER_TURNS } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import { relMoves, solveWithAlgs, type MethodPlan } from '../solverKit'
import type { Cube, Cubie, Move } from '../types'
import { ANTISUNE, CMLL_ADJACENT, PLL_Y, SUNE } from './algs'
import {
  buildBlock,
  edgesOriented,
  home,
  joined,
  orientationKey,
  pieces,
  piecesHome,
} from './pieces3'

/**
 * Roux (Gilles Roux): two 1x2x3 blocks, the last layer's corners, then the
 * last six edges with M and U only.
 *
 *   1. First block   1x2x3 on the left: DL edge, then the front pair, then
 *                    the back pair (any turn, M included)
 *   2. Second block  1x2x3 on the right, with <U, R, M, r> only: these never
 *                    touch the first block, so it stays built by construction
 *   3. CMLL          the four U corners (2-look: orient, then permute), with
 *                    algorithms that keep both blocks; edges may go anywhere
 *   4a. EO           orient the six remaining edges, <M, U>
 *   4b. UL/UR        place the UL and UR edges, <M, U>
 *   4c. M slice      place the four M-slice edges and centers, <M, U2>
 *
 * The blocks are built by `buildBlock` (a search over the block's own pieces
 * with the step's own turns), the LSE by searches with an LSE goal: the
 * method's structure is in its goals and move sets, not in algorithms.
 */

const FIRST_BLOCK = pieces('DL FL BL DFL DBL')
const SECOND_BLOCK = pieces('DR FR BR DFR DBR')
const BLOCKS = joined(FIRST_BLOCK, SECOND_BLOCK)
const U_CORNERS = pieces('UFL UFR UBL UBR')
const LSE_EDGES = pieces('UF UB UL UR DF DB')
const M_CENTERS = pieces('U F D B')

const FIRST_BLOCK_TURNS = moveSet('U D L R F B M')
const SECOND_BLOCK_TURNS = moveSet('U R M Rw')
const LSE_TURNS = moveSet('M U')
const M_SLICE_TURNS = moveSet('M U2')

/** The U center shows white or yellow: the M slice sits on its U/D axis. */
function centersOnAxis(cubies: readonly Cubie[]): boolean {
  const [x, y, z] = home('U')
  const center = cubies.find(
    (c) => c.position[0] === x && c.position[1] === y && c.position[2] === z,
  )
  const color = center?.stickers[0]?.color
  return color === FACE_COLOR.U || color === FACE_COLOR.D
}

// Step goals, on the whole cube.
const firstBlockDone = (c: Cube) => piecesHome(c, FIRST_BLOCK)
const blocksDone = (c: Cube) => piecesHome(c, BLOCKS)
const cmllDone = (c: Cube) => blocksDone(c) && piecesHome(c, U_CORNERS)
const lseOriented = (c: Cube) => blocksDone(c) && edgesOriented(c) && centersOnAxis(c)
const ulUrDone = (c: Cube) => lseOriented(c) && piecesHome(c, joined(U_CORNERS, pieces('UL UR')))

/** U corners twisted white side up (CMLL, first look). */
function cornersOriented(cube: Cube): boolean {
  return (
    blocksDone(cube) &&
    U_CORNERS.every((name) => {
      const [x, y, z] = home(name)
      const corner = cube.find(
        (c) => c.position[0] === x && c.position[1] === y && c.position[2] === z,
      )
      return corner?.stickers.some((s) => s.normal[1] === 1 && s.color === FACE_COLOR.U)
    })
  )
}

function solveCmllOrientation(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(SUNE, 'F'), relMoves(ANTISUNE, 'F')], cornersOriented, 4)
}

function solveCmllPermutation(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(CMLL_ADJACENT, 'F'), relMoves(PLL_Y, 'F')], cmllDone, 3)
}

const LSE_PIECES = joined(LSE_EDGES, M_CENTERS)

/** 4a: orient the six edges. Only the orientation pattern and the centers
 *  matter, so the search is keyed on just that. */
function solveLseOrientation(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: LSE_PIECES.map(home),
    moves: LSE_TURNS,
    goal: (p) => edgesOriented(p) && centersOnAxis(p),
    key: (p) =>
      `${orientationKey(p)}|${p.find((c) => c.stickers.length === 1 && c.position[1] === 1)?.stickers[0]?.color}`,
    maxDepth: 14,
  })
}

/** 4b: UL and UR home, corners aligned, edges still oriented. */
function solveUlUr(cube: Cube): Move[] {
  const goalPieces = joined(U_CORNERS, pieces('UL UR'))
  return solvePieces(cube, {
    track: joined(LSE_PIECES, U_CORNERS).map(home),
    moves: LSE_TURNS,
    goal: (p) => edgesOriented(p) && centersOnAxis(p) && piecesHome(p, goalPieces),
    maxDepth: 16,
  })
}

export const ROUX_PLAN: MethodPlan = [
  {
    key: 'stepFirstBlock',
    goal: firstBlockDone,
    moves: FIRST_BLOCK_TURNS,
    phases: [
      buildBlock(pieces('DL'), OUTER_TURNS),
      buildBlock(pieces('DL FL DFL'), moveSet('U R F B M')),
      buildBlock(FIRST_BLOCK, moveSet('U R B M')),
    ],
  },
  {
    key: 'stepSecondBlock',
    goal: blocksDone,
    moves: SECOND_BLOCK_TURNS,
    phases: [
      buildBlock(pieces('DR'), SECOND_BLOCK_TURNS),
      buildBlock(pieces('DR FR DFR'), SECOND_BLOCK_TURNS),
      buildBlock(SECOND_BLOCK, SECOND_BLOCK_TURNS),
    ],
  },
  {
    key: 'stepCMLL',
    goal: cmllDone,
    moves: OUTER_TURNS,
    phases: [solveCmllOrientation, solveCmllPermutation],
  },
  { key: 'stepLSEOrient', goal: lseOriented, moves: LSE_TURNS, phases: [solveLseOrientation] },
  { key: 'stepLSEUlUr', goal: ulUrDone, moves: LSE_TURNS, phases: [solveUlUr] },
  {
    key: 'stepLSEMiddle',
    goal: isSolved,
    moves: M_SLICE_TURNS,
    phases: [buildBlock(joined(LSE_PIECES, U_CORNERS), M_SLICE_TURNS)],
  },
]
