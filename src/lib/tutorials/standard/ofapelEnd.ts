import { isSolved } from '../../core/cube'
import type { Hold } from '../../core/hold'
import { parseMoves } from '../../core/notation'
import { colorsOf, sameAt } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie } from '../../core/types'
import { chainFigure, perState } from '../../teach/macros'
import type { FigureStage } from '../../teach/stages'
import { chainTo, fromEachHold, indicesOf, isEdge, ON_SIDE, onSide, SOLVED } from './ofapelKit'

/**
 * The Ofapel tutorial's last step (ofapel.ts): the cube turned on its side
 * (`z`), the middle layer becoming the M slice, then its four edges and its
 * centers by the page's formulas in M and U, held from the front or the
 * back, the shortest chain of them.
 */

/** The solved cube on its side: where each piece goes then. */
const SIDE_SOLVED = applyMoves(SOLVED, [ON_SIDE])
const homeOnSide = (c: Cubie) => {
  const goal = SIDE_SOLVED.find((s) => colorsOf(s) === colorsOf(c))!
  return (
    sameAt(c.position, goal.position) &&
    c.stickers.every((s) =>
      goal.stickers.some((g) => g.color === s.color && g.normal.join() === s.normal.join()),
    )
  )
}

/** The M slice's pieces where they stand: its edges and centers. */
const inSlice = (c: Cubie) => c.position[0] === 0 && c.stickers.length > 0
const sliceEdges = (cube: Cube) => indicesOf(cube, (c) => inSlice(c) && isEdge(c))

const CYCLE = parseMoves("B' U' R' U M' U' R U M B")
const CYCLE_MIRROR = parseMoves("B U L U' M' U L' U' M B'")
const SWAP_UP = parseMoves("M' U2 M U2")
const SWAP_UP_MIRROR = parseMoves("M U2 M' U2")
const FLIP_TOP = parseMoves("M U M U M U2 M' U M' U M' U2")
const FLIP_BOTTOM = parseMoves("M' U M U M U2 M' U M' U M' U2 M2")
const RARE = [parseMoves('M2 U2 M2 U2'), parseMoves("E2 M E2 M'")]
const SLICE_TURNS = ['M', 'M2', "M'"].map((f) => parseMoves(f))

/** Held either way round the slice: front or back. */
const BOTH_WAYS = { holds: ['F', 'B'] as readonly Hold[] }

const FINISH_GESTURES = [
  ...fromEachHold([CYCLE, CYCLE_MIRROR], 'cycle', BOTH_WAYS),
  ...fromEachHold([SWAP_UP, SWAP_UP_MIRROR], 'swapEdges', BOTH_WAYS),
  ...fromEachHold([FLIP_TOP, FLIP_BOTTOM], 'flip', BOTH_WAYS),
  ...fromEachHold(RARE, 'rare', BOTH_WAYS),
  ...fromEachHold(SLICE_TURNS, 'slice', { holds: ['F'] }),
]

const finishChain = perState((cube: Cube) =>
  onSide(cube) ? chainTo(cube, FINISH_GESTURES, (p) => p.every(homeOnSide), inSlice, 8) : null,
)

export const FINISH: FigureStage = {
  kind: 'figures',
  key: 'stepTutorialOfapelFinish',
  stage: 6,
  done: isSolved,
  figures: [
    {
      key: 'figureOfapelOnSide',
      match: (cube) => (onSide(cube) ? null : { hold: 'F', moves: [ON_SIDE] }),
    },
    ...['cycle', 'swapEdges', 'flip', 'rare', 'slice'].map((kind) =>
      chainFigure(finishChain, kind, `figureOfapelFinish_${kind}`),
    ),
  ],
  subjects: sliceEdges,
  progress: (cube) => ({
    done: onSide(cube) ? sliceEdges(cube).filter((i) => homeOnSide(cube[i]!)).length : 0,
    total: 4,
  }),
  algorithms: [[CYCLE], [SWAP_UP], [FLIP_TOP], [FLIP_BOTTOM]],
}
