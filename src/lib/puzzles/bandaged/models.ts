import type { Cube, CubeShape, Move } from '../../core/types'
import { colorsSolved, isSolved, solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { aiTurns, scrambleAi, solvedAi } from './ai'
import { BLOCKS } from './blocks'
import {
  cutsNoBlock,
  formsOfBlocks,
  marksFromColors,
  scrambleBandaged,
  turnsEver,
  withBlocks,
  withoutMarks,
  type Block,
} from './bonds'
import { BARS, paintBar } from './roadblockEntry'
import { PICK_FORM } from '../../editor/entry'
import { turnedKeys } from '../../editor/modes/toggles'
import { roadblockTurns, scrambleRoadblock, withBars, withoutBars } from './roadblock'

/**
 * A bandaged 3x3x3's model (bonds.ts): its blocks jam the turns that would
 * cut them, its colors alone say it is solved (its blocks are then home
 * too), and its turns are those that go in some form of it (a face a 2x2x2
 * holds never turns). Entered as a 3x3x3, its marks found from its colors.
 */
function bandaged(blocks: readonly Block[]): PuzzleModel {
  let solved: Cube | undefined
  let turns: Move[] | undefined
  // Read when called: cube.ts, which defines solvedCube, loads after this file.
  const solvedOne = () => (solved ??= withBlocks(solvedCube('3'), blocks))
  const turnsOf = () => (turns ??= turnsEver(solvedOne()))
  return {
    solved: solvedOne,
    turnAllowed: cutsNoBlock,
    isSolved: (cube) => colorsSolved(withoutMarks(cube)),
    turns: turnsOf,
    scramble: (length, rng, start) => scrambleBandaged(turnsOf())(length, rng, start),
    entry: {
      // Its joints clicked first when its blocks move (its forms, more
      // than one), then its colors.
      steps: () => {
        const forms = formsOfBlocks(solvedOne())
        return forms.length > 1 ? [{ kind: 'joints', joints: { forms: () => forms } }] : []
      },
      seen: (cube, held) => withoutMarks(held(cube)),
      built: (cube) => marksFromColors(cube, solvedOne()),
    },
  }
}

export const BANDAGED_MODELS = {
  ...(Object.fromEntries(
    Object.entries(BLOCKS).map(([shape, blocks]) => [shape, bandaged(blocks)]),
  ) as Record<keyof typeof BLOCKS, PuzzleModel>),
  // Its big blocks jam what would cut them.
  // Entered in the form it stands in.
  ai: {
    solved: () => solvedAi(solvedCube('4')),
    turnAllowed: aiTurns,
    scramble: scrambleAi,
    entry: { steps: PICK_FORM },
  },
  // Its bars jam a slice along them; its colors only count, its bars may
  // lie either way.
  roadblock: {
    solved: () => withBars(solvedCube('5')),
    turnAllowed: roadblockTurns,
    scramble: scrambleRoadblock,
    isSolved: (cube) => isSolved(withoutBars(cube)),
    // Its bars' marks are not entered (it is, at START), and no center of
    // it is fixed: it is not held otherwise. Its bars lie as solved but on
    // the faces turned.
    // Its bars set first, then its colors, a bar painted whole
    // (roadblockEntry.ts).
    entry: {
      steps: () => [{ kind: 'toggles', toggles: BARS }],
      paint: { by: 'colors', together: paintBar },
      seen: (cube) => withoutBars(cube),
      built: (cube, { toggles }) => withBars(cube, turnedKeys(toggles)),
    },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
