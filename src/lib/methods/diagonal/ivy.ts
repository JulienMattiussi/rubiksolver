import { allTurnsOf } from '../../core/moveSet'
import { colorsOf } from '../../core/pieces'
import { IVY_TURNS } from '../../puzzles/shared/skewbs'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Vec3 } from '../../core/types'
import { skewbKit } from '../shared/skewbKit'

/**
 * The Ivy Cube, face by face, as ruwix.com teaches it
 * (twisty-puzzles/ivy-cube): its corners never leave their places, so they
 * set how the puzzle is held (the one of its twelve holdings that brings
 * each home); the turns found there are played back from how it stands.
 *
 *   1. The white face: its two corners turned white up, then its center
 *      brought between them
 *   2. The yellow face, opposite: the same, the white one kept
 *   3. The four centers left, one by one
 *
 * Each step plays the fewest turns (the puzzle is small: 29,160 states);
 * the page's last fix (a corner a third off) never comes, the corners
 * being turned first.
 */

const TURNS = allTurnsOf('ivy')

/** Held twelve ways, as the Skewb Ultimate: a third about a diagonal, a
 *  half about the vertical (the turns that keep its corners' places). */
const { SOLVED, held, home, oneByOne } = skewbKit(
  'ivy',
  [([x, y, z]: Vec3): Vec3 => [y, z, x], ([x, y, z]: Vec3): Vec3 => [-x + 0, y, -z + 0]],
  () => true,
  (upright: Cube) =>
    upright
      .filter((c) => c.stickers.length === 3)
      .every((c) => SOLVED_PLACE.get(colorsOf(c)) === c.position.join()),
)
/** Where each corner belongs (it never leaves it). */
const SOLVED_PLACE = new Map(
  SOLVED.filter((c) => c.stickers.length === 3).map((c) => [colorsOf(c), c.position.join()]),
)

const corners = (y: number) =>
  SOLVED.filter((c) => c.stickers.length === 3 && c.position[1] === y).map((c) => c.position)
const WHITE: Vec3[] = [...corners(1), [0, 1, 0]]
const YELLOW: Vec3[] = [...corners(-1), [0, -1, 0]]
const SIDES = SOLVED.filter((c) => c.stickers.length === 1 && c.position[1] === 0).map(
  (c) => c.position,
)

const SINGLE = IVY_TURNS.map((t) => [t])

export const IVY_PLAN: MethodPlan = [
  {
    key: 'stepIvyFirstFace',
    goal: home(WHITE),
    moves: TURNS,
    phases: [held(oneByOne(WHITE, [], SINGLE, false, 8))],
  },
  {
    key: 'stepIvyOppositeFace',
    goal: home([...WHITE, ...YELLOW]),
    moves: TURNS,
    phases: [held(oneByOne(YELLOW, WHITE, SINGLE, false, 8))],
  },
  {
    key: 'stepIvyCenters',
    goal: home([...WHITE, ...YELLOW, ...SIDES]),
    moves: TURNS,
    phases: [held(oneByOne(SIDES, [...WHITE, ...YELLOW], SINGLE, false, 8))],
  },
]
