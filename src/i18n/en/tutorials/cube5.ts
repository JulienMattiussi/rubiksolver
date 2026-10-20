import type { TutorialTexts } from '../../tutorialTexts'

export const CUBE5_EN: TutorialTexts = {
  checks: {
    stepTutorialPair5: (done: number) =>
      done === 24
        ? 'Check the twelve edges are whole: the cube now solves as a 3x3.'
        : 'Check one more wing now sits beside its middle edge, and the centers stayed whole.',
    stepTutorialParity5: () => 'Check the front edge’s two wings swapped, the rest untouched.',
  },
  figures: {
    figurePairEdge5:
      'Spot the shimmering wings: the slice takes one away, the formula flips the front right edge, the slice comes back with the missing wing.',
    figureEdgeParity5:
      'A single edge has its two wings swapped: the edge parity, impossible on a 3x3. A slice formula swaps them alone.',
  },
  terms: {
    termFixedCenter:
      'The **fixed center**: the piece in the middle of each side. It never moves and gives its side’s color.',
    termCenter5:
      'A **center**: one of the eight pieces around the fixed center, with one face showing.',
    termMidge:
      'A **middle edge**: the piece in the middle of a border. Like the fixed center, it tells its edge’s colors.',
    termWing5:
      'A **wing**: one of the two pieces on either side of a middle edge. They go back beside the middle edge of their colors.',
    termEdge5:
      'A **whole edge**: a middle edge and its two wings, side by side and the same way round.',
    termInner5: 'An **inner slice**: one of the three middle layers.',
  },
  progress: {
    stepTutorialCenters5: (done: number, total: number) =>
      `${done} of ${total} center${total > 1 ? 's' : ''} in place`,
    stepTutorialPair5: (done: number, total: number) =>
      `${done} of ${total} wing${total > 1 ? 's' : ''} beside their middle edge`,
    stepTutorialParity5: (done: number) => (done ? 'Edge parity fixed' : 'Edge parity to fix'),
  },
  titles: {
    stepTutorialCenters5: 'Place the centers',
    stepTutorialPair5: 'Complete the edges',
    stepTutorialParity5: 'Fix the edge parity',
  },
  hints: {
    stepTutorialCenters5:
      'Bring each color’s eight centers around its fixed center one by one: yellow down, white up, then green, red, blue and orange around. While the side is open, a slice and a turn do; then a commutator (a slice, a turn, the slice undone, the turn undone) keeps the finished sides whole.',
    stepTutorialPair5:
      'Set the wings beside the middle edge of their colors one by one. A slice takes a wing away, the formula flips the front right edge, the slice comes back: the centers stay whole.',
    stepTutorialParity5:
      'On a 5x5, the last edge can keep its two wings swapped, which no edge formula fixes. A slice formula swaps them before moving on to the 3x3.',
  },
}
