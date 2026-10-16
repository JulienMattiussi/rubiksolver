import type { TUTORIAL_FR } from '../fr/tutorial'

export const TUTORIAL_EN: typeof TUTORIAL_FR = {
  button: 'Tutorial',
  buttonTitle: 'Learn to solve it step by step, picking the pieces to move',
  exit: 'Leave the tutorial',
  apply: 'Apply the formula',
  undo: 'Undo the move',
  finish: 'Complete the move',
  next: 'Next',
  facing: (color: string) => `Hold the ${color} center facing you.`,
  facingTitle: 'Turn the view to face it',
  piece: (stickers: number, colors: string) =>
    stickers === 1
      ? `the ${colors} center`
      : stickers === 2
        ? `the ${colors} edge`
        : `the ${colors} corner`,
  spot: (piece: string) => `Spot ${piece}: the arrow shows its place.`,
  spotSwap: (piece: string, other: string) =>
    `Spot ${piece}, and ${other} which stands in its place.`,
  play: (count: number) => (count === 1 ? 'Play this move:' : `Play these ${count} moves:`),
  check: (piece: string) => `Check the new positions: ${piece} is in its place.`,
  checkAll: 'Check the new positions: the pieces are in their place.',
  legendMoved:
    'The hatched cubes will be moved by the formula, with no effect on the expected result.',
  noFormula: 'No formula gets there without disturbing the pieces already placed.',
  solved: 'Solved, well done!',
  stage: (n: number) => `Step ${n}`,
  beforeStages: 'Before starting',
  progress: {
    stepTutorialCross: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} in place`,
  },
  titles: {
    stepRecenter: 'Put the centers back in place',
    stepTutorialCross: 'Build the yellow cross',
    stepBottomCorners: 'Place the first layer’s corners',
  },
  hints: {
    stepRecenter:
      'A middle slice moved the centers: they go back first, everything else is placed around them.',
    stepTutorialCross: 'Place the cube’s four yellow edges one by one.',
    stepBottomCorners: 'The cross is done! The rest, the first layer’s corners, is coming soon.',
  },
}
