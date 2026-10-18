import type { TutorialTexts } from '../../tutorialTexts'

export const MORPH_EN: TutorialTexts = {
  checks: {
    stepTutorialMorphCorner: () => 'Check a tip now stands in the bottom half.',
    stepTutorialMorphTurn: (done: number) =>
      done === 2
        ? 'Check both tips of the other half are now turned right.'
        : done === 1
          ? 'Check one tip of the other half is now turned right.'
          : 'No tip is turned right yet: the next formula sees to it.',
    stepTutorialMorphPlace: () => 'Check every piece is in its place: the Pyramorphinx is solved.',
  },
  figures: {
    figureMorphNone: 'Spot the other half’s two tips: none is turned right.',
    figureMorphOne: 'Spot the other half’s two tips: only one is turned right.',
    figureMorphTurnTop:
      'The other half’s pieces already follow each other in the right order: one turn of the top places them.',
    figureMorphAdjacent:
      'Two neighboring pieces must be swapped: brought to the right, the formula swaps the two right pieces.',
    figureMorphDiagonal: 'Two pieces across must be swapped: a formula of its own does it.',
  },
  terms: {
    termMorphTip: 'A **tip**: a piece with three faces, at a corner of the pyramid.',
    termMiddle:
      'A **middle**: a piece with a single face, in the middle of a side of the pyramid. It can turn on itself without showing.',
    termHalf:
      'A **half**: all that turns at once, two tips and two middles. The Pyramorphinx turns like a 2x2 cube: a quarter turn changes its shape, another brings it back.',
    termHalfClockwise:
      '**Clockwise**: it is the way a clock’s hands go, looking at the half that turns.',
    termHalfCounterclockwise:
      '**Counterclockwise**: it is the opposite way to a clock’s hands, still looking at the half that turns.',
  },
  progress: {
    stepTutorialMorphHalf: (done: number, total: number) =>
      `${done} of ${total} piece${total > 1 ? 's' : ''} placed`,
    stepTutorialMorphTurn: (done: number, total: number) =>
      `${done} of ${total} tip${total > 1 ? 's' : ''} turned right`,
    stepTutorialMorphPlace: (done: number, total: number) =>
      `${done} of ${total} piece${total > 1 ? 's' : ''} in place`,
  },
  titles: {
    stepTutorialMorphCorner: 'Bring a tip down',
    stepTutorialMorphHalf: 'Build the first half',
    stepTutorialMorphTurn: 'Turn the other half’s tips',
    stepTutorialMorphPlace: 'Place the other half',
  },
  hints: {
    stepTutorialMorphCorner:
      'The Pyramorphinx has no fixed piece: a tip of the bottom half is the landmark. None stands there: one turn brings one.',
    stepTutorialMorphHalf:
      'A tip of the bottom half is the landmark, and the sides’ colors are read on it. Place the other pieces of that half one by one: the other bottom tip, and the middles of the bottom and front sides.',
    stepTutorialMorphTurn:
      'Turn the other half’s two tips so that one turn of the top is enough to set each in its place.',
    stepTutorialMorphPlace:
      'Place the other half’s four pieces: a turn of the top, or two pieces swapped side by side or across.',
  },
}
