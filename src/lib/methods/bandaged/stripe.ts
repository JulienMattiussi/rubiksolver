import { isSolved, solvedCube } from '../../core/cube'
import { invertMoves, parseMoves } from '../../core/moves'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import { applyMoves } from '../../core/turn'
import type { MethodPlan } from '../../solve/solverKit'
import { colorsOf } from '../../core/pieces'
import type { Cubie } from '../../core/types'
import { asIn, blocksAt, bothWays, inPlaces, phaseAs, toStart } from './kit'
import { COMM_UR, INSERT_RIGHT, INSERT_RIGHT_BACK, PLL_UB, SUNE_BACK } from '../standard/algs'

/**
 * Stripe, as taught on fan2cube.fr (stripe2): three bars in a Y. Held at
 * START (ABA' from solved), H turns freely:
 *
 *   0. START           ABA' (each bar where it goes there)
 *   1. The bottom      its edges and (AD), then its corners: [HD] (turned
 *                      by [HD]²), the cube's middle slice turned to keep
 *                      (AD) (h[HD]h'), here the turns that go
 *   2. The equator     [HD][H'A'] and [H'A'][HD], set up the same way
 *   3. Top corners     placed by T = D[PH']PHP'D'H² (or D[PH']PHP'D'H')
 *   4. Top cross       D[PH]²D' (the page's (HP)°(HD)°: here it turns top
 *                      edges over as it cycles three of them)
 *   5. Corners turned  DHD'H.DH²D'H²
 *   6. Edges placed    (HG) -> (HD) -> (HA) = D².HDHD'.(H'D')².HD'
 *   7. Back            AB'A'
 *
 * Its places are named as they stand at START. Notation (page -> app): H B
 * A P G D = U D F B L R; [X Y] = X Y X' Y'. Each formula's effect is
 * asserted in tests/unit/puzzles/bandaged/stripe.test.ts.
 */

/** ABA': START from solved. */
export const START = parseMoves("F D F'")
/** (HDA) -> (BAD): [HD] */
export const DOWN = parseMoves(COMM_UR)
/** (HA) -> (AD): [HD][H'A']; (HD) -> (AD): [H'A'][HD]. */
export const MIDDLE = [parseMoves(INSERT_RIGHT), parseMoves(INSERT_RIGHT_BACK)]
/** (HAG) (HGP): T = D[PH']PHP'D'H²; (HAG) -> (HPD) -> (HDA): D[PH']PHP'D'H' */
export const SWAP = parseMoves("R B U' B' U B U B' R' U2")
export const CYCLE_CORNERS = parseMoves("R B U' B' U B U B' R' U'")
/** The top cross: D[PH]²D', top edges turned over as three cycle. */
export const FLIP = parseMoves("R B U B' U' B U B' U' R'")
/** (HDA)+ (HPD)+ (HGP)+: DHD'H.DH²D'H² */
export const TWIST = parseMoves(SUNE_BACK)
/** (HG) -> (HD) -> (HA): D².HDHD'.(H'D')².HD' */
export const CYCLE = parseMoves(PLL_UB)

const AT_START = applyMoves(solvedCube('stripe'), START)
const ALL = allTurnsOf('stripe')
const U = moveSet('U')

const BOTTOM_EDGES = ['DF', 'DL', 'DB', 'DR', 'FR']
const BOTTOM = [...BOTTOM_EDGES, 'DFR', 'DRB', 'DBL', 'DLF']
const F2L = [...BOTTOM, 'FL', 'BL', 'BR']
const TOP_CORNERS = ['UFR', 'URB', 'UBL', 'ULF']
const TOP_EDGES = ['UF', 'UR', 'UB', 'UL']

const done = (names: readonly string[]) => asIn(AT_START, names)
/** Each top edge's sticker that faces up at START, by its colors. */
const UP_AT_START = new Map(
  AT_START.filter((c) => c.position[1] === 1 && c.stickers.length === 2).map((c) => [
    colorsOf(c),
    c.stickers.find((s) => s.normal[1] === 1)!.color,
  ]),
)
/** The top edges turned up as at START, wherever they stand on top (the
 *  top cross). */
const crossUp = (c: readonly Cubie[]) =>
  c
    .filter((p) => p.position[1] === 1 && p.stickers.length === 2)
    .every((p) => p.stickers.find((s) => s.normal[1] === 1)?.color === UP_AT_START.get(colorsOf(p)))

const cornersPlaced = (c: readonly Cubie[]) => done(F2L)(c) && inPlaces(AT_START, TOP_CORNERS)(c)

export const STRIPE_PLAN: MethodPlan = [
  {
    key: 'stepBandagedStart',
    goal: blocksAt(AT_START, true),
    moves: ALL,
    phases: [toStart(AT_START, true)],
  },
  {
    key: 'stepStripeBottom',
    goal: done(BOTTOM),
    moves: ALL,
    phases: [
      phaseAs(AT_START, BOTTOM_EDGES, { free: ALL, formulas: bothWays([DOWN, ...MIDDLE]) }),
      phaseAs(AT_START, BOTTOM, { free: ALL, formulas: bothWays([DOWN, ...MIDDLE]) }),
    ],
  },
  {
    key: 'stepMiddle',
    goal: done(F2L),
    moves: ALL,
    phases: [1, 2, 3].map((n) =>
      phaseAs(AT_START, F2L.slice(0, BOTTOM.length + n), { free: ALL, formulas: bothWays(MIDDLE) }),
    ),
  },
  {
    key: 'stepPermuteCorners',
    goal: cornersPlaced,
    moves: ALL,
    phases: [
      phaseAs(AT_START, [...F2L, ...TOP_CORNERS], {
        free: U,
        formulas: bothWays([SWAP, CYCLE_CORNERS]),
        goal: (c) => inPlaces(AT_START, TOP_CORNERS)(c) && done(F2L)(c),
      }),
    ],
  },
  {
    key: 'stepTopCross',
    goal: (c) => cornersPlaced(c) && crossUp(c),
    moves: ALL,
    phases: [
      phaseAs(AT_START, [...F2L, ...TOP_CORNERS, ...TOP_EDGES], {
        free: U,
        formulas: bothWays([FLIP]),
        goal: (c) => cornersPlaced(c) && crossUp(c),
      }),
    ],
  },
  {
    key: 'stepOrientCorners',
    goal: (c) => done([...F2L, ...TOP_CORNERS])(c) && crossUp(c),
    moves: ALL,
    phases: [
      phaseAs(AT_START, [...F2L, ...TOP_CORNERS, ...TOP_EDGES], {
        free: U,
        formulas: bothWays([TWIST]),
        goal: (c) => done([...F2L, ...TOP_CORNERS])(c) && crossUp(c),
      }),
    ],
  },
  {
    key: 'stepPermuteEdges',
    goal: done([...F2L, ...TOP_CORNERS, ...TOP_EDGES]),
    moves: ALL,
    phases: [
      phaseAs(AT_START, [...F2L, ...TOP_CORNERS, ...TOP_EDGES], {
        free: U,
        formulas: bothWays([CYCLE]),
      }),
    ],
  },
  { key: 'stepBandagedBack', goal: isSolved, moves: ALL, phases: [() => invertMoves(START)] },
]
