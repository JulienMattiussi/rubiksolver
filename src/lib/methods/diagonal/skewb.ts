import { solvedCube } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import { invertMoves } from '../../core/moves'
import { parseDinoMoves, RAINBOW_CORNERS } from '../../puzzles/shared/rainbow'
import type { MethodPlan } from '../../solve/solverKit'
import type { CubeShape, Cubie, RainbowMove, Vec3 } from '../../core/types'
import { aroundTop, notPetal, skewbKit } from '../shared/skewbKit'
import { colorsOf } from '../../core/pieces'

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

/** The Skewb's turns in a formula of `kind`'s (a Master Skewb's outer
 *  layers, which turn its corners and centers as a Skewb's). */
const parseAs = (kind: 'skewb' | 'master') => (formula: string) => parseDinoMoves(formula, kind)

/** A corner's set: its coordinates' signs multiplied. Turns never take a
 *  corner from one set to the other ("deux clans", skewb3). */
const setOf = (p: readonly number[]) => Math.sign(p[0]! * p[1]! * p[2]!)

/**
 * "Le Haut d'abord" on a Skewb's corners and centers, the Skewb's own or a
 * Master Skewb's (its outer layers turn them as a Skewb's: its first step,
 * "finir le Skewb"): the steps, and the bricks a longer method goes on with.
 */
export function skewbFirst(shape: CubeShape, kind: 'skewb' | 'master') {
  const turns = allTurnsOf(shape)
  const parse = parseAs(kind)
  const solved = solvedCube(shape)
  const corners = new Map(
    solved.filter((c) => c.stickers.length === 3).map((c) => [colorsOf(c), c.position] as const),
  )
  /** Held 24 ways (a third about a diagonal, a quarter about the vertical),
   *  as the top center and each corner in its own set say. */
  const kit = skewbKit(
    shape,
    [([x, y, z]: Vec3): Vec3 => [y, z, x], ([x, y, z]: Vec3): Vec3 => [z, y, -x + 0]],
    (upright) =>
      upright
        .filter((c) => c.stickers.length === 3)
        .every((c) => setOf(c.position) === setOf(corners.get(colorsOf(c))!)),
  )
  const { held, home, oneByOne } = kit
  const isCorner = (c: Cubie) => c.stickers.length === 3
  const isCenter = (c: Cubie) => c.stickers.length === 1 && notPetal(c)
  const TOP_CORNERS = solved.filter((c) => isCorner(c) && c.position[1]! > 0).map((c) => c.position)
  const BOTTOM = solved.filter((c) => isCorner(c) && c.position[1]! < 0).map((c) => c.position)
  const SIDE_CENTERS = solved
    .filter((c) => isCenter(c) && c.position[1]! <= 0)
    .map((c) => c.position)
  /** The outer turns of the bottom corners, both ways. */
  const BOTTOM_TURNS = turns.turns.filter(
    (t): t is RainbowMove => 'triangle' in t && !t.slice && RAINBOW_CORNERS[t.triangle][1] === -1,
  )
  /** Each formula from each side of the top, both ways. */
  const fromEachSide = (formulas: readonly string[]) =>
    formulas.flatMap((f) => aroundTop(parse(f))).flatMap((m) => [m, invertMoves(m)])
  const skewb = [...TOP_CORNERS, ...SIDE_CENTERS, ...BOTTOM]
  const steps: MethodPlan = [
    {
      key: 'stepSkewbTopPlaced',
      goal: home(TOP_CORNERS, true),
      moves: turns,
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
      moves: turns,
      phases: [held(oneByOne(TOP_CORNERS, [], fromEachSide([TOP_TWIST]), false, 4))],
    },
    {
      key: 'stepSkewbCenters',
      goal: (cube) => home([...TOP_CORNERS, ...SIDE_CENTERS])(cube),
      moves: turns,
      phases: [held(oneByOne(SIDE_CENTERS, TOP_CORNERS, fromEachSide(CENTER_CYCLES), false, 4))],
    },
    {
      key: 'stepSkewbBottom',
      goal: (cube) => home(skewb)(cube),
      moves: turns,
      phases: [held(oneByOne(BOTTOM, [], fromEachSide([BOTTOM_TWIST]), false, 4))],
    },
  ]
  return { steps, kit, skewb, parse }
}

export const SKEWB_PLAN: MethodPlan = skewbFirst('skewb', 'skewb').steps
