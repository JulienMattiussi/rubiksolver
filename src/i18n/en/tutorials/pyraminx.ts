import type { TutorialTexts } from '../../tutorialTexts'

export const PYRAMINX_EN: TutorialTexts = {
  checks: {
    stepTutorialPyraTop: (done: number) =>
      done === 3
        ? 'Check the three top edges are between their sides, even flipped.'
        : `Check ${done} top edge${done > 1 ? 's are' : ' is'} now between its sides.`,
    stepTutorialPyraFlip: (done: number) =>
      done === 6
        ? 'Check every edge is the right way round: the Pyraminx is solved.'
        : 'Check two more edges are now the right way round.',
  },
  figures: {
    figurePyraCycle:
      'Spot the top edges not between their sides: the formula turns the three round.',
    figurePyraFlip: 'Spot the edges the wrong way round: the formula flips two at a time.',
  },
  terms: {
    termTip:
      'A **tip**: the small piece at the end of each corner. It turns alone, taking nothing along.',
    termPyraCenter:
      'A **center**: the piece just under the tip, with three faces. It never leaves its corner: the centers tell each side’s color.',
    termPyraEdge: 'An **edge**: a piece with two faces, between two corners.',
    termLayer:
      'A **layer**: all that turns with a corner, its tip, its center and the three edges around.',
    termPyraClockwise:
      '**Clockwise**: it is the way a clock’s hands go, looking at the corner that turns, from in front of it.',
    termPyraCounterclockwise:
      '**Counterclockwise**: it is the opposite way to a clock’s hands, still looking at the corner that turns.',
  },
  progress: {
    stepTutorialPyraCenters: (done: number, total: number) =>
      `${done} of ${total} center${total > 1 ? 's' : ''} in place`,
    stepTutorialPyraTips: (done: number, total: number) =>
      `${done} of ${total} tip${total > 1 ? 's' : ''} in place`,
    stepTutorialPyraBottom: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} in place`,
    stepTutorialPyraTop: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} between their sides`,
    stepTutorialPyraFlip: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} the right way round`,
  },
  titles: {
    stepTutorialPyraCenters: 'Turn the centers',
    stepTutorialPyraTips: 'Turn the tips',
    stepTutorialPyraBottom: 'Place the bottom edges',
    stepTutorialPyraTop: 'Place the top edges',
    stepTutorialPyraFlip: 'Flip the edges',
  },
  hints: {
    stepTutorialPyraCenters:
      'Turn each corner’s layer until its center wears the colors of the three sides around it.',
    stepTutorialPyraTips: 'Turn each tip alone so it wears its center’s colors.',
    stepTutorialPyraBottom:
      'Place the three edges of the bottom side one by one, each between its two colors.',
    stepTutorialPyraTop: 'Place the three top edges between their sides, even flipped.',
    stepTutorialPyraFlip:
      'Flip the edges the wrong way round, two at a time: the Pyraminx is then solved.',
  },
}
