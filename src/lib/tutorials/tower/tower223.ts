import { solvedCube } from '../../core/cube'
import { CUBE_HOLDS } from '../../core/hold'
import type { Cubie, Face, Move } from '../../core/types'
import {
  SLIM_ADJACENT,
  SLIM_EDGE_SWAP,
  SLIM_OPPOSITE,
  SLIM_PAIRS,
} from '../../methods/tower/slimTower'
import { tutorialOf } from '../../teach/kit'
import { chainedPieces, eachHold, type Gesture } from '../../teach/macros'
import { towerKit } from './towerKit'
import { SLIM_GLOSSARY } from './towerTerms'

/**
 * The Slim Tower's (2x2x3) tutorial, "Corners then edges", as its manual
 * teaches it (QiYi MoFangGe, its misprint corrected: see
 * `methods/tower/slimTower.ts`), the tower held a side in front
 * (`CUBE_HOLDS`):
 *   1. the bottom corners, one at a time, by the fewest turns (the manual
 *      leaves this step to each);
 *   2. the top corners: two across swapped by formula 1 (three times), two
 *      beside by formula 2, the top turned before if need be;
 *   3. the middle's edges: swapped two by two by formula 3, or two beside
 *      by formula 4 (three times).
 * Each step plays the shortest chain of its gestures, each from the hold
 * it reads in, the pieces home where the step began kept home, the tower
 * read the way that keeps the most pieces placed (`towerKit`), formula 2
 * leaving it turned a quarter.
 */

const SHAPE = '223'
const SOLVED = solvedCube(SHAPE)

const isCorner = (c: Cubie) => c.stickers.length === 3
const isEdge = (c: Cubie) => c.stickers.length === 2
const homesOf = (keep: (c: Cubie) => boolean) => SOLVED.filter(keep).map((c) => c.position)
const BOTTOM = homesOf((c) => isCorner(c) && c.position[1]! < 0)
const TOP = homesOf((c) => isCorner(c) && c.position[1]! > 0)
const EDGES = homesOf(isEdge)

const { targetsOf, faceColor, placeChain } = towerKit(SHAPE, [BOTTOM, TOP, EDGES])

/** A turn of a face (`depth` 2: its middle layer alone), `amount` quarters. */
const turn = (face: Face, amount: number, depth?: 2): Move[] =>
  amount % 4 === 0 ? [] : [{ face, amount: (amount % 4) as 1 | 2 | 3, ...(depth && { depth }) }]
const QUARTERS = [1, 2, 3]
const thrice = (moves: readonly Move[]) => [...moves, ...moves, ...moves]

/** A layer's quarter turns alone, from the front. */
const layerTurns = (face: Face, depth?: 2): Gesture[] =>
  QUARTERS.map((t) => ({ hold: 'F', kind: 'turn', moves: turn(face, t, depth) }))

// 1. The bottom corners: any single turn (the sides only by halves).
const SINGLE_TURNS: Gesture[] = [
  ...layerTurns('U'),
  ...layerTurns('D'),
  ...(['R', 'L', 'F', 'B'] as const).map((face): Gesture => ({
    hold: 'F',
    kind: 'turn',
    moves: turn(face, 2),
  })),
]
const BOTTOM_CHAIN = placeChain(SINGLE_TURNS, BOTTOM, { keep: isCorner, turned: true })

// 2. The top corners: formula 1 (three times) or 2, from each side, the
// top turned before it (and back after); or the top turned alone.
const TOP_SETUPS = [0, ...QUARTERS].map((t) => turn('U', t))
const TOP_CHAIN = placeChain(
  [
    ...eachHold([thrice(SLIM_OPPOSITE)], 'opposite', CUBE_HOLDS, {
      setups: TOP_SETUPS,
      back: true,
    }),
    ...eachHold([SLIM_ADJACENT], 'adjacent', CUBE_HOLDS, { setups: TOP_SETUPS, back: true }),
    ...layerTurns('U'),
  ],
  [...BOTTOM, ...TOP],
  { keep: isCorner, turned: true },
)

// 3. The middle's edges: formula 3 or 4 (three times), from each side; or
// the middle turned alone. The corners read too: they say how the tower
// is held (an edge alone stands home some way round).
const EDGE_CHAIN = placeChain(
  [
    ...eachHold([SLIM_PAIRS], 'pairs', CUBE_HOLDS),
    ...eachHold([thrice(SLIM_EDGE_SWAP)], 'swap', CUBE_HOLDS),
    ...layerTurns('U', 2),
  ],
  [...BOTTOM, ...TOP, ...EDGES],
  { keep: () => true, turned: true },
)

export const SLIM_TOWER_TUTORIAL = tutorialOf({
  glossary: SLIM_GLOSSARY,
  holding: 'tower',
  pieceKind: (c) => (isCorner(c) ? 'corner' : isEdge(c) ? 'edge' : 'piece'),
  faceColor,
  stages: [
    {
      kind: 'pieces',
      key: 'stepSlimBottom',
      stage: 1,
      targets: targetsOf(BOTTOM),
      words: true,
      ...chainedPieces(BOTTOM_CHAIN, CUBE_HOLDS),
    },
    {
      kind: 'pieces',
      key: 'stepSlimTop',
      stage: 2,
      targets: targetsOf(TOP),
      algorithms: [[SLIM_OPPOSITE], [SLIM_ADJACENT]],
      times: [[3], [1]],
      ...chainedPieces(TOP_CHAIN, CUBE_HOLDS),
    },
    {
      kind: 'pieces',
      key: 'stepSlimEdges',
      stage: 3,
      targets: targetsOf(EDGES),
      algorithms: [[SLIM_PAIRS], [SLIM_EDGE_SWAP]],
      times: [[1], [3]],
      ...chainedPieces(EDGE_CHAIN, CUBE_HOLDS),
    },
  ],
})
