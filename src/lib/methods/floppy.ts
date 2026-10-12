import { isSolved } from '../cube'
import { homesOf } from '../pieces'
import { normalIndex } from '../geometry'
import { parseMoves } from '../moves'
import { allTurnsOf } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import type { Color, Cube, Cubie } from '../types'

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
 *
 * The edges and the center never leave their spot, so they say which color
 * each face takes, however the Floppy is held (a quarter turn about its
 * axis is entered as is): an edge's side sticker gives its side's color.
 */

/** Flips the F and R edges, nothing else (asserted in tests/unit/floppy.test.ts). */
export const FLIP_EDGES = parseMoves('F2 R2 F2 R2 F2 R2')

const TURNS = allTurnsOf('331')
const isCorner = (c: Cubie) => c.stickers.length === 4
const isEdge = (c: Cubie) => c.stickers.length === 3
const CORNERS = homesOf('331', isCorner)
const PIECES = homesOf('331', (c) => isCorner(c) || isEdge(c))

/** The color of each face (by normal index): the center's on top and
 *  below, each side's from the edge on it, its sticker facing outward. */
function faceColors(cube: Cube): Map<number, Color> {
  const faces = new Map<number, Color>()
  for (const c of cube) {
    if (c.stickers.length === 3 || c.stickers.length === 2) {
      // An edge: its side sticker faces along its own position. The center:
      // its two stickers, up and down.
      for (const s of c.stickers) {
        const outward = s.normal.every((v, a) => v === c.position[a])
        if (outward || c.stickers.length === 2) faces.set(normalIndex(s.normal), s.color)
      }
    }
  }
  return faces
}

const showsFaces = (faces: Map<number, Color>) => (c: Cubie) =>
  c.stickers.every((s) => s.color === faces.get(normalIndex(s.normal)))

const cornersDone = (cube: Cube) => cube.filter(isCorner).every(showsFaces(faceColors(cube)))

/** A search over `track` until every piece shows its face's color. */
const solveRelative = (track: typeof CORNERS, macros: (typeof FLIP_EDGES)[]) => (cube: Cube) => {
  const right = showsFaces(faceColors(cube))
  return solvePieces(cube, {
    track,
    moves: TURNS,
    macros,
    goal: (pieces) => pieces.every(right),
    maxDepth: 12,
  })
}

export const FLOPPY_PLAN: MethodPlan = [
  { key: 'stepCorners', goal: cornersDone, moves: TURNS, phases: [solveRelative(CORNERS, [])] },
  {
    key: 'stepFlipEdges',
    goal: isSolved,
    moves: TURNS,
    phases: [solveRelative(PIECES, [FLIP_EDGES])],
  },
]
