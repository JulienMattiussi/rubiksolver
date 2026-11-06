import { isSolved } from '../../core/cube'
import { mapPiece, rotateN } from '../../core/geometry'
import { recolored } from '../../core/pieces'
import { OUTER_TURNS } from '../../core/moveSet'
import type { Color, Cube, Face, Turn } from '../../core/types'
import { linesOff, withoutLines } from '../../puzzles/twisted/impossible'
import { turnBack } from '../../solve/holdings'
import {
  projectPlan,
  relMoves,
  SIDES,
  solveWithAlgs,
  type MethodPlan,
  type StepSpec,
} from '../../solve/solverKit'
import {
  BEGINNER_PLAN,
  crossDone,
  firstLayerDone,
  solveFirstLayerCorners,
} from '../standard/layers3'
import { centersHome, holdStep } from '../standard/recenter'

/**
 * The Rubik's Impossible (puzzles/twisted/impossible.ts) by its official
 * guide ("You Can Do The Rubik's Impossible"): the layer by layer method,
 * white first (its face has two anchors and none of the ambiguous edges),
 * each center's line turned along its face's when the guide says, with its
 * two formulas:
 *
 *   1. the white cross;
 *   2. the white center's line, by F U F' U F U F' U F U (the cross kept,
 *      the front center's line turned too, set with the middle layer);
 *   3. the white corners;
 *   4. the four middle centers' lines, each by F2 D2 F D2 F2 held in front
 *      (the white layer kept);
 *   5. the middle layer, then the last layer as the 3x3's (yellow cross,
 *      its corners oriented then placed, its edges placed by a U-perm
 *      turning each side an even number of quarters): the yellow center's
 *      line follows, every turn of a face turning its corners' order and
 *      its line together.
 *
 * The 3x3's steps read the puzzle held white down, its colors renamed as
 * the 3x3's (white for yellow, blue for green): turned over, it is a 3x3
 * whose first layer is yellow, its turns named back.
 */

/** White on top, for the guide's two formulas. */
export const WHITE_LINE = "F U F' U F U F' U F U"
export const MIDDLE_LINE = 'F2 D2 F D2 F2'

/** A U-perm turning each side an even number of quarters, so that no
 *  side center's line turns (the 3x3's, `PLL_UA`, turns the right one). */
export const U_PERM = "F2 U L R' F2 L' R U F2"

/** Turned over (white down), as `x2` would. */
const turnOver = (v: readonly [number, number, number]) => rotateN(v, 'x', 2)

/** Its colors turned over with it: white and yellow, green and blue. */
const RENAMED = new Map<Color, Color>([
  ['W', 'Y'],
  ['Y', 'W'],
  ['G', 'B'],
  ['B', 'G'],
  ['R', 'R'],
  ['O', 'O'],
])

/** The puzzle held white down, read as the 3x3 it then is. */
const heldOver = (cube: Cube): Cube =>
  recolored(withoutLines(cube).map(mapPiece(turnOver)), RENAMED)

/** A turn of the puzzle held white down, named as it stands. */
const named = (turn: Turn): Turn => turnBack(turn, turnOver)

/** The 3x3's beginner step of this key, read on the puzzle held over. */
const step3 = (key: string): StepSpec =>
  projectPlan(
    BEGINNER_PLAN.filter((s) => s.key === key),
    heldOver,
    named,
  )[0]!

/** Whether the lines of the centers of these faces lie as solved. */
const linesOn =
  (faces: readonly Face[]) =>
  (cube: Cube): boolean =>
    !linesOff(cube).some((f) => faces.includes(f))

const WHITE: readonly Face[] = ['U']
const FIRST: readonly Face[] = ['U', ...SIDES]

/** A center's line turned by a formula, as long as it lies across: tried
 *  held from each side, the goal keeping what is done. */
const turnLines = (alg: string, goal: (cube: Cube) => boolean) => (cube: Cube) =>
  solveWithAlgs(
    cube,
    SIDES.map((f) => relMoves(alg, f)),
    goal,
    4,
  )

const crossOver = (cube: Cube) => crossDone(heldOver(cube))
const whiteDone = (cube: Cube) => crossOver(cube) && linesOn(WHITE)(cube)
const layerDone = (cube: Cube) => firstLayerDone(heldOver(cube)) && linesOn(WHITE)(cube)
const linesDone = (cube: Cube) => firstLayerDone(heldOver(cube)) && linesOn(FIRST)(cube)

/** A 3x3 step read held over, the lines done so far kept. */
const over = (key: string, renamed: string): StepSpec => {
  const spec = step3(key)
  return { ...spec, key: renamed, goal: (cube) => spec.goal(cube) && linesOn(FIRST)(cube) }
}

export const IMPOSSIBLE_PLAN: MethodPlan = [
  holdStep((cube) => centersHome(withoutLines(cube))),
  { ...step3('stepBottomCross'), key: 'stepWhiteCross' },
  {
    key: 'stepWhiteLine',
    goal: whiteDone,
    moves: OUTER_TURNS,
    phases: [turnLines(WHITE_LINE, whiteDone)],
  },
  {
    key: 'stepWhiteCorners',
    goal: layerDone,
    moves: OUTER_TURNS,
    phases: [(cube) => solveFirstLayerCorners(heldOver(cube)).map(named)],
  },
  {
    key: 'stepMiddleLines',
    goal: linesDone,
    moves: OUTER_TURNS,
    phases: [turnLines(MIDDLE_LINE, linesDone)],
  },
  over('stepMiddle', 'stepMiddle'),
  over('stepTopCross', 'stepYellowCross'),
  over('stepOrientCorners', 'stepOrientCorners'),
  over('stepPermuteCorners', 'stepPermuteCorners'),
  {
    key: 'stepPermuteEdges',
    goal: isSolved,
    moves: OUTER_TURNS,
    phases: [
      (cube) => solveWithAlgs(heldOver(cube), [relMoves(U_PERM, 'F')], isSolved, 6).map(named),
    ],
  },
]
