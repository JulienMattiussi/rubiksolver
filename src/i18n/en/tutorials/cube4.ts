import type { TutorialTexts } from '../../tutorialTexts'

export const CUBE4_EN: TutorialTexts = {
  checks: {
    stepTutorialPair4: (done: number) =>
      done === 12
        ? 'Check the twelve edges are paired: the cube now solves as a 3x3.'
        : 'Check two more wings now make an edge, and the centers stayed whole.',
    stepTutorialOllParity4: () =>
      'Check the front edge flipped over, the centers and the first two layers untouched.',
    stepTutorialPllParity4: () => 'Check the front and back edges swapped, the rest untouched.',
  },
  figures: {
    figurePairEdge:
      'Spot the two shimmering wings: the formula joins them into one edge, then puts the slice back.',
    figureOllParity:
      'A single top edge is upside down: the OLL parity, impossible on a 3x3. A slice formula flips it alone.',
    figurePllParity:
      'Two top edges are swapped: the PLL parity, impossible on a 3x3. A slice formula swaps the front and back ones.',
  },
  terms: {
    termCenter4:
      'A **center**: one of the four pieces in the middle of a side, they have one face showing.',
    termWing: 'A **wing**: a piece with two faces, on a border. Each pair of colors has two.',
    termEdge4: 'An **edge**: two wings of the same colors, side by side and the same way round.',
    termInner: 'An **inner slice**: one of the two middle layers.',
  },
  progress: {
    stepTutorialCenters4: (done: number, total: number) =>
      `${done} of ${total} center${total > 1 ? 's' : ''} in place`,
    stepTutorialPair4: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} paired`,
    stepTutorialOllParity4: (done: number) => (done ? 'OLL parity fixed' : 'OLL parity to fix'),
    stepTutorialPllParity4: (done: number) => (done ? 'PLL parity fixed' : 'PLL parity to fix'),
  },
  titles: {
    stepTutorialCenters4: 'Gather the centers',
    stepTutorialPair4: 'Pair the edges',
    stepTutorialOllParity4: 'Fix the OLL parity',
    stepTutorialPllParity4: 'Fix the PLL parity',
  },
  hints: {
    stepTutorialCenters4:
      'Gather each color’s four centers on their side one by one: yellow down, white up, then green, red, blue and orange around.',
    stepTutorialPair4:
      'Join each edge’s two wings one by one. A slice sets them side by side, a swap joins them, the slice comes back: the centers stay whole.',
    stepTutorialOllParity4:
      'On a 4x4, an edge can end up alone upside down, which no 3x3 allows. It is flipped before building the white cross.',
    stepTutorialPllParity4:
      'On a 4x4, two edges can end up swapped alone, which no 3x3 allows. They are swapped before placing the white edges.',
  },
}
