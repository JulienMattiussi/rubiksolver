import type { TUTORIAL_FR } from '../fr/tutorial'
import { CUBE3_EN } from './tutorials/cube3'
import { CUBE2_EN } from './tutorials/cube2'
import { CUBES_EN } from './tutorials/cubes'
import { MORPH_EN } from './tutorials/morph'
import { PYRAMIDS_EN } from './tutorials/pyramids'
import { PYRAMINX_EN } from './tutorials/pyraminx'
import { mergeTexts } from '../tutorialTexts'

const TEXTS = mergeTexts([CUBES_EN, CUBE3_EN, CUBE2_EN, PYRAMIDS_EN, PYRAMINX_EN, MORPH_EN])

/** The kinds of pieces, named. */
export const PIECES_EN: Record<string, string> = {
  center: 'center',
  edge: 'edge',
  corner: 'corner',
  tip: 'tip',
  middle: 'middle',
}

export const TUTORIAL_EN: typeof TUTORIAL_FR = {
  button: 'Tutorial',
  buttonTitle: 'Learn to solve it step by step, picking the pieces to move',
  exit: 'Leave the tutorial',
  close: 'Close the tutorial',
  apply: 'Apply the formula',
  undo: 'Undo the move',
  finish: 'Complete the move',
  next: 'Next',
  alreadyDone: 'As things stand, the cubes this step moves are already in the right place.',
  alreadyDoneNext: 'On to the next step.',
  locked: 'Unavailable during the tutorial: leave it first',
  facing: (color: string, down: string) =>
    `Hold the ${color} center facing you, the ${down} center down.`,
  facingFace: (color: string, down: string) =>
    `Hold the ${color} side facing you, the ${down} side down.`,
  holding: TEXTS.holding,
  facingTitle: 'Turn the view to face it',
  piece: (kind, colors) => `the ${colors.join('-')} ${PIECES_EN[kind] ?? 'piece'}`,
  spot: (piece: string) => `Spot ${piece}.`,
  spotSwap: (piece: string, other: string) =>
    `Spot ${piece}, and ${other} which stands in its place.`,
  play: (count: number) =>
    count === 0
      ? 'Play the moves.'
      : count === 1
        ? 'Play this move:'
        : `Play these ${count} moves:`,
  repeat: (times: number) => `Then play these moves ${times} times:`,
  round: (n: number, times: number) => `(round ${n} of ${times})`,
  thenPlay: (count: number) =>
    count === 1 ? 'Then play this move:' : `Then play these ${count} moves:`,
  thenSequence: 'Then play this sequence:',
  sequence: (count: number) => `Play this sequence of ${count} moves:`,
  repeatAll: (count: number, times: number) =>
    `Play these ${count} moves, ${times} times in a row:`,
  check: (piece: string) => `Check the new positions: ${piece} is in its place.`,
  checkAll: 'Check the new positions: the pieces are in their place.',
  checkFigure: 'Check the new figure the white draws on top.',
  checks: TEXTS.checks,
  figures: TEXTS.figures,
  glossary: 'The words',
  glossaryIntro:
    'This first, preliminary step is to learn and understand the words used to describe and handle the cube.',
  termCount: (n, total) => `Word ${n} of ${total}`,
  skipTerms: 'Skip',
  backToGlossary: 'Back to the words',
  terms: TEXTS.terms,
  legendMoved:
    'The hatched cubes will be moved by the formula, with no effect on the expected result.',
  noFormula: 'No formula gets there without disturbing the pieces already placed.',
  solved: 'Solved, well done!',
  stage: (n: number, total: number) => `Step ${n} of ${total}`,
  beforeStages: 'Before starting',
  progress: TEXTS.progress,
  titles: TEXTS.titles,
  hints: TEXTS.hints,
}
