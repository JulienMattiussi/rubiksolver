import { isBoxed } from '../../core/cube'
import type { MethodPlan } from '../../solve/solverKit'
import { atHome, homesOf } from '../../core/pieces'
import { moveSet } from '../../core/moveSet'
import { solvePieces } from '../../solve/pieceSearch'
import type { Cubie } from '../../core/types'
import { innerDomino } from '../tower/towerLayers'
import { backToBox, BLOCK_TURNS } from './fashionShape'

/**
 * Fashion-V, as fan2cube.fr solves it (fashioncube2): laid down to a
 * 3x3x5 first ("passer en 3x3x5"), then solved as the towers are once in
 * their box, two Dominos stacked and a middle layer (towerLayers.ts), the
 * page's inner tower (h, the equator, b) and outer one (H, B):
 *
 *   I.   Laid down  every pair lying, the equator's edges in it the right
 *                   way round, by blocks alone (fashionShape.ts: the page
 *                   says "comme un Rubik's Cube")
 *   II.  The equator  its edges home about its centers, which never move
 *                   ("ranger l'équateur, bien placé et bien orienté"), by
 *                   the blocks' half turns
 *   III. The outer Domino (H, B), then the inner one (h, b): the
 *                   Domino's formulas, which "perturbent l'équateur" once,
 *                   played twice over ("par paires"), the layers turned
 *                   between: no other layer sees them, the equator stays
 *
 * The page solves the inner tower first, then the outer, and ends with two
 * "singularités": the outer first (its pieces unique; the inner one's go by
 * twins, which take up any parity) needs neither.
 */
/** The equator's pieces: its edges and its side centers. */
const inEquator = (c: Cubie) => c.position[1] === 0 && c.stickers.length > 0
/** What keeps the box and moves the equator's edges: the blocks' half
 *  turns (its centers never move). */
const EQUATOR_TURNS = moveSet('Rw2 Lw2 Fw2 Bw2')

export const FASHION_PLAN: MethodPlan = [
  {
    key: 'stepFashionLay',
    goal: isBoxed,
    moves: { generators: BLOCK_TURNS, turns: BLOCK_TURNS },
    phases: [(cube) => backToBox(cube, 'fashion')],
  },
  {
    key: 'stepFashionEquator',
    goal: (cube) => cube.filter(inEquator).every((c) => atHome(c, 'fashion')),
    moves: EQUATOR_TURNS,
    phases: [
      (cube) =>
        solvePieces(cube, {
          track: homesOf('fashion', inEquator),
          moves: EQUATOR_TURNS,
          among: inEquator,
          maxDepth: 12,
        }),
    ],
  },
  ...innerDomino('fashion', 2, 1),
  ...innerDomino('fashion', 1, 2),
]
