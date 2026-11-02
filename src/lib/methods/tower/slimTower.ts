import { isSolved } from '../../core/cube'
import { homeAt, homesOf, withStickers } from '../../core/pieces'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import { solvePieces } from '../../solve/pieceSearch'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Move, Vec3 } from '../../core/types'
import { parseMoves } from '../../core/notation'
import { DESCEND_CORNER, SWAP_CORNERS } from './domino'

/**
 * Slim Tower (2x2x3), "equator then corners", as taught on fan2cube.fr
 * (tower2231, tower2232): solved like the 2x2x4 tower with one equator less,
 * that is like a Domino standing up. Its sides only take half turns, so the
 * Domino's corner formulas apply as they are.
 *
 *   I.   Equator         its four edges, intuitively (any turn)
 *   II.  Bottom corners  brought down with the Domino's descend formula,
 *                        which also swaps two equator edges: corners
 *                        therefore come down two by two
 *   III. Top corners     swapped two at a time
 */

const isCorner = withStickers(3)
const EQUATOR = homesOf('223', (c) => c.position[1] === 0)
const BOTTOM_CORNERS = homesOf('223', (c) => isCorner(c) && c.position[1] < 0)
const CORNERS = homesOf('223', isCorner)

/** A phase searching with `turns` and the step's formulas, towards the
 *  tracked pieces at home (every piece is unique: searched from both ends). */
function solveWith(track: readonly Vec3[], turns: string | 'all', formulas: Move[][] = []) {
  const moves = turns === 'all' ? allTurnsOf('223') : moveSet(turns)
  return (cube: Cube) => solvePieces(cube, { track, moves, macros: formulas, maxDepth: 20 })
}

const piecesHome = (positions: readonly Vec3[]) => (cube: Cube) => homeAt(cube, positions, '223')

export const SLIM_TOWER_PLAN: MethodPlan = [
  {
    key: 'stepEquator',
    goal: piecesHome(EQUATOR),
    moves: allTurnsOf('223'),
    phases: [solveWith(EQUATOR, 'all')],
  },
  {
    key: 'stepBottomCorners',
    goal: piecesHome([...EQUATOR, ...BOTTOM_CORNERS]),
    moves: moveSet('U D F2'),
    phases: [solveWith([...EQUATOR, ...BOTTOM_CORNERS], 'U D', [DESCEND_CORNER])],
  },
  {
    key: 'stepTopCorners',
    goal: isSolved,
    moves: moveSet('U D R2'),
    phases: [solveWith([...EQUATOR, ...CORNERS], 'U', [SWAP_CORNERS])],
  },
]

/*
 * The formulas of the Slim Tower's manual (QiYi MoFangGe, "223 Cube
 * Tutorial"), corners then edges, as printed but formula 4, which reads
 * R2 U2 R2 U2, three times nothing (its drawing shows two moves: R2 U2).
 * Formula 2 ends with the whole tower turned a quarter (its last U' is
 * Dw' then the tower turned round): read as it then stands.
 */

/** Played three times: the two top corners across the top swapped. */
export const SLIM_OPPOSITE = parseMoves('R2 U D R2 U')
/** The two right top corners swapped, the tower then turned a quarter. */
export const SLIM_ADJACENT = parseMoves("U2 F2 R2 U R2 Uw' R2 D R2 U' R2 U'")
/** The middle's edges swapped two by two, front and back. */
export const SLIM_PAIRS = parseMoves('R2 2U2 R2')
/** Played three times: the two right edges of the middle swapped. */
export const SLIM_EDGE_SWAP = parseMoves('R2 U2')
