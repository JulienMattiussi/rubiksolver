import { allTurnsOf } from '../../core/moveSet'
import { invertMoves } from '../../core/moves'
import { RAINBOW_CORNERS } from '../../puzzles/shared/rainbow'
import type { MethodPlan } from '../../solve/solverKit'
import type { RainbowMove, Vec3 } from '../../core/types'
import { both, parse, skewbKit } from '../shared/skewbKit'

/**
 * Skewb Ultimate, "le Haut d'abord", as taught on fan2cube.fr
 * (skewbultimate2). Only the four bottom corners turn (B, O, H, E), so the
 * top center never moves: it sets how the puzzle is held.
 *
 *   1. Top corners placed, by turns of the bottom ones
 *   2. Top corners turned: G- = [BO], A+ = [O'B'], P- = [OH], D+ = [B'E']
 *   3. Centers placed: (A)<->(P) by [OH'], (G)<->(D) by [BO'],
 *      (A)->(G)->(B) by [B'E'][HE], (D)->(A)->(B) by [H'E'][HO]
 *   4. Centers turned: (A)°(G)° = [HE']²[EB']²
 *   5. Bottom corners turned: K = [BO']⁴, Z = [OH']⁴ (the bottom corners
 *      follow the top ones: once these are placed, so are they)
 *
 * The puzzle is first read held as solved, its top center home (one of its
 * twelve holdings), and the turns found are played back from how it stands.
 * Each formula's effect is asserted in tests/unit/puzzles/polyhedron/skewbU.test.ts.
 */

export const TOP_TWISTS = ['[BO]', "[O'B']", '[OH]', "[B'E']"]
export const CENTER_SWAPS = ["[OH']", "[BO']", "[B'E'][HE]", "[H'E'][HO]"]
export const CENTER_TURN = "[HE'][HE'][EB'][EB']"
export const BOTTOM_TWISTS = ["[BO'][BO'][BO'][BO']", "[OH'][OH'][OH'][OH']"]

const TURNS = allTurnsOf('skewbU')

/** Held twelve ways: a third about a diagonal, a half about the vertical
 *  (the turns that keep its dodecahedron). */
const { SOLVED, held, home, oneByOne } = skewbKit('skewbU', [
  ([x, y, z]: Vec3): Vec3 => [y, z, x],
  ([x, y, z]: Vec3): Vec3 => [-x + 0, y, -z + 0],
])
const BOTTOM: readonly Vec3[] = SOLVED.filter(
  (c) => c.position[1] === -1 && c.stickers.length === 3,
).map((c) => c.position)
const CENTERS = SOLVED.filter((c) => c.stickers.length === 4).map((c) => c.position)
const TOP_CORNERS = SOLVED.filter((c) => c.position[1] === 1 && c.stickers.length === 3).map(
  (c) => c.position,
)
const SIDE_CENTERS = CENTERS.filter((p) => p[1] !== 1)

/** The turns of the bottom corners, both ways. */
const BOTTOM_TURNS: RainbowMove[] = TURNS.turns.filter(
  (t): t is RainbowMove => 'triangle' in t && RAINBOW_CORNERS[t.triangle][1] === -1,
) as RainbowMove[]

const TOP_TWIST_MACROS = both(TOP_TWISTS)
const SWAP_MACROS = both(CENTER_SWAPS)
const CENTER_TURN_MACROS = [
  parse(CENTER_TURN),
  ...SWAP_MACROS.map((x) => [...x, ...parse(CENTER_TURN), ...invertMoves(x)]),
]
const BOTTOM_MACROS = both(BOTTOM_TWISTS)

export const SKEWB_U_PLAN: MethodPlan = [
  {
    key: 'stepSkewbTopPlaced',
    goal: home(TOP_CORNERS, true),
    moves: TURNS,
    phases: [
      held(
        oneByOne(
          TOP_CORNERS,
          [],
          BOTTOM_TURNS.map((t) => [t]),
          true,
          8,
        ),
      ),
    ],
  },
  {
    key: 'stepSkewbTopTwist',
    goal: home(TOP_CORNERS),
    moves: TURNS,
    phases: [held(oneByOne(TOP_CORNERS, [], TOP_TWIST_MACROS, false, 4))],
  },
  {
    key: 'stepSkewbCenters',
    goal: (cube) => home(TOP_CORNERS)(cube) && home(SIDE_CENTERS, true)(cube),
    moves: TURNS,
    phases: [held(oneByOne(SIDE_CENTERS, TOP_CORNERS, SWAP_MACROS, true, 4))],
  },
  {
    key: 'stepSkewbCenterTurn',
    goal: (cube) => home([...TOP_CORNERS, ...CENTERS])(cube),
    moves: TURNS,
    phases: [held(oneByOne(SIDE_CENTERS, TOP_CORNERS, CENTER_TURN_MACROS, false, 4))],
  },
  {
    key: 'stepSkewbBottom',
    goal: (cube) => home([...TOP_CORNERS, ...CENTERS, ...BOTTOM])(cube),
    moves: TURNS,
    phases: [held(oneByOne(BOTTOM, [], BOTTOM_MACROS, false, 4))],
  },
]
