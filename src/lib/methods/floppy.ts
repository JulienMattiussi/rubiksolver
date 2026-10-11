import { homeAt, homesOf, isSolved } from '../cube'
import { parseMoves } from '../moves'
import { allTurnsOf } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import type { Cube, Cubie } from '../types'

/**
 * Floppy (3x3x1), "corners then edges", as taught on fan2cube.fr (floppy1):
 * a 3x3 one layer tall. Its sides only take half turns, so the edges never
 * leave their spot (a half turn just flips the one it carries) and only the
 * corners travel; 192 states in all.
 *
 *   1. Corners  placed with plain half turns, which finishes the outline
 *   2. Edges    flipped two at a time: (A2 D2)3 = (F2 R2)3 flips the front
 *               and right edges and touches nothing else, brought onto the
 *               flipped pair by half-turn setups
 */

/** Flips the F and R edges, nothing else (asserted in tests/unit/floppy.test.ts). */
export const FLIP_EDGES = parseMoves('F2 R2 F2 R2 F2 R2')

const TURNS = allTurnsOf('331')
const isCorner = (c: Cubie) => c.stickers.length === 4
const isEdge = (c: Cubie) => c.stickers.length === 3
const CORNERS = homesOf('331', isCorner)
const PIECES = homesOf('331', (c) => isCorner(c) || isEdge(c))

const cornersDone = (cube: Cube) => homeAt(cube, CORNERS, '331')

export const FLOPPY_PLAN: MethodPlan = [
  {
    key: 'stepCorners',
    goal: cornersDone,
    moves: TURNS,
    phases: [(cube) => solvePieces(cube, { track: CORNERS, moves: TURNS, maxDepth: 12 })],
  },
  {
    key: 'stepFlipEdges',
    goal: isSolved,
    moves: TURNS,
    phases: [
      (cube) =>
        solvePieces(cube, { track: PIECES, moves: TURNS, macros: [FLIP_EDGES], maxDepth: 12 }),
    ],
  },
]
