import { isSolved, solvedCube } from '../../core/cube'
import { invertMoves, parseMoves } from '../../core/moves'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import { applyMoves } from '../../core/turn'
import type { MethodPlan } from '../../solve/solverKit'
import { asIn, blocksAt, bothWays, phaseAs, toStart } from './kit'
import {
  COMM_FR,
  COMM_UR,
  CORNER_CYCLE,
  CORNER_TWIST_PAIR,
  INSERT_RIGHT,
  INSERT_RIGHT_BACK,
  OLL_EDGE_TURN,
} from '../standard/algs'

/**
 * Detour, as taught on fan2cube.fr (detour2, "morphocode"): two bars and
 * five tabs (the "∟" among them). Solved much as the Diamond, once in
 * START (D²H'D²HD from solved), where H turns freely:
 *
 *   0. START          D²H'D²HD (the bars and tabs where they go there)
 *   1. (BPG), (BG)    the corner down by [AD'] (turned by [AD']²), the edge
 *                     by [HD][H'A'] (turned over by J), the cube held so
 *                     they go there (G'H², t H')
 *   2. (BAD), (AD)    the same, by [HD] and [HD][H'A'] or [H'A'][HD]
 *   3. Top edges      placed by J = A[DH]A'H, turned by J²
 *   4. Top corners    placed by [AD'].G[D'A]G', turned by [AD']².G[D'A]².G'
 *   5. Back           D'H'D²HD²
 *
 * Its places are named as they stand at START. Notation (page -> app): H B
 * A P G D = U D F B L R; [X Y] = X Y X' Y'. Each formula's effect is
 * asserted in tests/unit/puzzles/bandaged/detour.test.ts.
 */

/** D²H'D²HD: START from solved. */
export const START = parseMoves("R2 U' R2 U R")
/** (HDA) -> (BAD): [AD'] (and [AD']² turns it); [HD] the same. */
export const DOWN = parseMoves(COMM_FR)
export const DOWN_RIGHT = parseMoves(COMM_UR)
/** (HA) -> (AD): [HD][H'A']; (HD) -> (AD): [H'A'][HD]. */
export const MIDDLE = [parseMoves(INSERT_RIGHT), parseMoves(INSERT_RIGHT_BACK)]
/** J = A[DH]A'H: the top edges placed (and J² turns them). */
export const J = parseMoves(OLL_EDGE_TURN)
/** (HAG) -> (HGP) -> (HPD): [AD'].G[D'A]G' */
export const CORNERS = parseMoves(CORNER_CYCLE)
/** (HAG)- (HGP)+: [AD']².G[D'A]².G' */
export const TWIST = parseMoves(CORNER_TWIST_PAIR)

const AT_START = applyMoves(solvedCube('detour'), START)
const ALL = allTurnsOf('detour')
const U = moveSet('U')

const FIRST = ['DBL', 'DL']
const SECOND = [...FIRST, 'DFR', 'FR']
const EDGES = [...SECOND, 'UF', 'UR', 'UB', 'UL']
const TOP = [...EDGES, 'UFR', 'URB', 'UBL', 'ULF']

const done = (names: readonly string[]) => asIn(AT_START, names)
const LOW = bothWays([DOWN, DOWN_RIGHT, ...MIDDLE, J])

export const DETOUR_PLAN: MethodPlan = [
  {
    key: 'stepBandagedStart',
    goal: blocksAt(AT_START, false),
    moves: ALL,
    phases: [toStart(AT_START, false)],
  },
  {
    key: 'stepDetourFirst',
    goal: done(FIRST),
    moves: ALL,
    phases: [phaseAs(AT_START, FIRST, { free: ALL, formulas: LOW })],
  },
  {
    key: 'stepDetourSecond',
    goal: done(SECOND),
    moves: ALL,
    phases: [phaseAs(AT_START, SECOND, { free: U, formulas: LOW })],
  },
  {
    key: 'stepPermuteEdges',
    goal: done(EDGES),
    moves: ALL,
    phases: [phaseAs(AT_START, EDGES, { free: U, formulas: bothWays([J]) })],
  },
  {
    key: 'stepPermuteCorners',
    goal: done(TOP),
    moves: ALL,
    phases: [phaseAs(AT_START, TOP, { free: U, formulas: bothWays([CORNERS, TWIST]) })],
  },
  { key: 'stepBandagedBack', goal: isSolved, moves: ALL, phases: [() => invertMoves(START)] },
]
