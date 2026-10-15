import { solvedCube } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import { invertMoves } from '../../core/moves'
import { RAINBOW_CORNERS } from '../../puzzles/shared/rainbow'
import type { MethodPlan } from '../../solve/solverKit'
import type { RainbowMove, Vec3 } from '../../core/types'
import { aroundTop, parse, skewbKit } from '../shared/skewbKit'

/**
 * Skewb, "le Haut d'abord", as taught on fan2cube.fr (skewb2 and skewb4):
 * only the four bottom corners turn (B, O, H, E), so the top center never
 * moves and sets how the puzzle is held (white on top).
 *
 *   1. Top corners placed, by turns of the bottom ones ("comme le Pocket"),
 *      then turned: A- = [B'O'], each from its side (t H)
 *   2. Centers placed: (A)->(G)->(B) = [B'E'][HE], (A)->(B)->(D) =
 *      [H'E'][HO], from each side; the bottom corners follow the top ones,
 *      once these are placed, so are they
 *   3. Bottom corners turned: [BO']², from each side
 *
 * The puzzle is read held as solved, its top center home, and the turns
 * found are played back from how it stands. Each formula's effect is
 * asserted in tests/unit/puzzles/diagonal/skewb.test.ts.
 */

/** A- (the top front right corner), the bottom ones turned too. */
export const TOP_TWIST = "[B'O']"
/** (A)->(G)->(B) and (A)->(B)->(D). */
export const CENTER_CYCLES = ["[B'E'][HE]", "[H'E'][HO]"]
/** The four bottom corners turned: B-, O-, H+, E+. */
export const BOTTOM_TWIST = "[BO'][BO']"

const TURNS = allTurnsOf('skewb')

/** Each corner's home, by its colors. */
const SOLVED_CORNERS = new Map(
  solvedCube('skewb')
    .filter((c) => c.stickers.length === 3)
    .map(
      (c) =>
        [
          c.stickers
            .map((s) => s.color)
            .sort()
            .join(),
          c.position,
        ] as const,
    ),
)

/** A corner's set: its coordinates' signs multiplied. Turns never take a
 *  corner from one set to the other ("deux clans", skewb3). */
const setOf = (p: readonly number[]) => p[0]! * p[1]! * p[2]!

/** Held 24 ways (a third about a diagonal, a quarter about the vertical),
 *  as the white center on top and each corner in its own set say. */
const { SOLVED, held, home, oneByOne } = skewbKit(
  'skewb',
  [([x, y, z]: Vec3): Vec3 => [y, z, x], ([x, y, z]: Vec3): Vec3 => [z, y, -x + 0]],
  (upright) =>
    upright
      .filter((c) => c.stickers.length === 3)
      .every((c) => {
        const colors = c.stickers
          .map((s) => s.color)
          .sort()
          .join()
        const home = SOLVED_CORNERS.get(colors)!
        return setOf(c.position) === setOf(home)
      }),
)
const isCorner = (p: Vec3) => p.every((v) => v !== 0)
const TOP_CORNERS = SOLVED.filter((c) => c.position[1] === 1 && isCorner(c.position)).map(
  (c) => c.position,
)
const BOTTOM = SOLVED.filter((c) => c.position[1] === -1 && isCorner(c.position)).map(
  (c) => c.position,
)
const SIDE_CENTERS = SOLVED.filter((c) => !isCorner(c.position) && c.position[1] !== 1).map(
  (c) => c.position,
)

/** The turns of the bottom corners, both ways. */
const BOTTOM_TURNS = TURNS.turns.filter(
  (t): t is RainbowMove => 'triangle' in t && RAINBOW_CORNERS[t.triangle][1] === -1,
)

/** Each formula from each side of the top, both ways. */
const fromEachSide = (formulas: readonly string[]) =>
  formulas.flatMap((f) => aroundTop(parse(f))).flatMap((m) => [m, invertMoves(m)])

export const SKEWB_PLAN: MethodPlan = [
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
    phases: [held(oneByOne(TOP_CORNERS, [], fromEachSide([TOP_TWIST]), false, 4))],
  },
  {
    key: 'stepSkewbCenters',
    goal: (cube) => home([...TOP_CORNERS, ...SIDE_CENTERS])(cube),
    moves: TURNS,
    phases: [held(oneByOne(SIDE_CENTERS, TOP_CORNERS, fromEachSide(CENTER_CYCLES), false, 4))],
  },
  {
    key: 'stepSkewbBottom',
    goal: (cube) => home([...TOP_CORNERS, ...SIDE_CENTERS, ...BOTTOM])(cube),
    moves: TURNS,
    phases: [held(oneByOne(BOTTOM, [], fromEachSide([BOTTOM_TWIST]), false, 4))],
  },
]
