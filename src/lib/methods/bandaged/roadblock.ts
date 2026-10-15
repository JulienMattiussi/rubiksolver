import { projectOuterPlan } from '../standard/solver4/steps'
import { allTurnsOf } from '../../core/moveSet'
import { toStart, withoutBars } from '../../puzzles/bandaged/roadblock'
import { to3x3 } from '../standard/solver5/project'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Move } from '../../core/types'
import { BEGINNER_PLAN } from '../standard/layers3'
import { barsAtStart, barsDone, middleDone, middlesHome, placeBars } from './roadblockBars'
import { edgesDone, pairEdges, wingsEven } from './roadblockEdges'

/**
 * RoadBlock-I, "méthode des centres", after fan2cube.fr (roadblock-I2):
 * solved as a Professor (5x5x5), reduced to a 3x3x3, always keeping it
 * able to turn what the next formula needs.
 *
 * Which slice can turn depends on how each face's bars lie only, and that
 * only changes with that face's quarter turns: at START (the four sides'
 * bars level) the equator's three slices turn; a few quarter turns of the
 * faces around another axis lay their bars across it, its slices turn,
 * and the same quarter turns undone bring START back. Every formula here
 * goes from START back to START.
 *
 *   0. Middle centers  each face's middle bar home, by the middle slices
 *   1. Parity          the wings an even permutation from home (a quarter
 *                      of an equator slice when not)
 *   2. Bars            the others, by pure 3-cycles of bars
 *   3. Edges           each edge's wings by its middle, by 3-cycles of wings
 *   4. As a 3x3        its colors only: solved, its bars may lie either way
 */

/** An odd wing permutation, made even by a quarter of an equator slice
 *  (a 4-cycle of wings; it keeps START and the middles). */
const fixParity = (cube: Cube): Move[] =>
  wingsEven(cube) ? [] : [{ face: 'U', amount: 1, depth: 2 }]

const TURNS = allTurnsOf('roadblock')

export const ROADBLOCK_PLAN: MethodPlan = [
  { key: 'stepRbStart', goal: barsAtStart, moves: TURNS, phases: [toStart], optional: true },
  { key: 'stepRbMiddles', goal: middleDone, moves: TURNS, phases: [middlesHome] },
  {
    key: 'stepRbParity',
    goal: (cube) => middleDone(cube) && wingsEven(cube),
    moves: TURNS,
    phases: [fixParity],
    optional: true,
  },
  { key: 'stepRbBars', goal: barsDone, moves: TURNS, phases: [placeBars] },
  { key: 'stepRbEdges', goal: edgesDone, moves: TURNS, phases: [pairEdges] },
  ...projectOuterPlan(BEGINNER_PLAN, (cube) => to3x3(withoutBars(cube))),
]
