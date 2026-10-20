import type { TutorialTexts } from '../../tutorialTexts'

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

export const OFAPEL_EN: TutorialTexts = {
  checks: {
    stepTutorialOfapelPlace: (done: number) =>
      done === 4
        ? 'Check the four top corners are now in their places, even turned wrong.'
        : `Check ${plural(done, 'top corner')} ${done > 1 ? 'are' : 'is'} now in place.`,
    stepTutorialOfapelTwist: (done: number) =>
      done === 4
        ? 'Check the top face is now done.'
        : done === 0
          ? 'No top corner is turned right yet: the next formula sees to it.'
          : `Check ${plural(done, 'top corner')} ${done > 1 ? 'are' : 'is'} now turned right.`,
    stepTutorialOfapelFinish: (done: number) =>
      done === 4
        ? 'Check the cube is solved.'
        : done === 0
          ? 'No edge of the middle slice is in place yet: the next formula sees to it.'
          : `Check ${plural(done, 'edge')} of the middle slice ${done > 1 ? 'are' : 'is'} now in place.`,
  },
  figures: {
    figureOfapelSwap:
      'Spot two top corners already in their places, even turned wrong: held on the right side, the formula swaps the other two.',
    figureOfapelSwapTwice:
      'No top corner is in its place beside another: the formula played twice in a row, its last half turn dropped, swaps the corners across.',
    figureOfapelTwistTurn:
      'The top corners are all turned right: a turn of the top puts them back in place.',
    figureOfapelTwistLast:
      'Spot the top corners turned wrong: hold the cube as shown, one formula turns them all.',
    figureOfapelTwistMore:
      'Spot the top corners turned wrong: hold the cube as shown and play the formula, another will follow.',
    figureOfapelOnSide:
      'All is done but the middle layer: tip the cube to the right, as a quarter turn of the front face. It becomes the upright middle slice.',
    figureOfapelFinish_cycle:
      'Three edges of the middle slice have to cycle: the formula puts them back without disturbing anything else.',
    figureOfapelFinish_swapEdges:
      'The formula moves three edges of the middle slice, without flipping them.',
    figureOfapelFinish_flip:
      'Two edges of the middle slice are flipped: the formula flips them back without moving anything.',
    figureOfapelFinish_rare:
      'A rarer case: the formula swaps the edges, or the centers, of the middle slice two by two.',
    figureOfapelFinish_slice: 'Turn the middle slice to bring its centers back facing their sides.',
  },
  terms: {
    termMiddleSlice:
      'The **middle slice**: the layer between left and right. It turns the same way as the left face.',
    termWideTop:
      'A **wide turn**: the top two layers turned together, the same way as the top face.',
  },
  progress: {
    stepTutorialOfapelCorner: (done: number, total: number) =>
      `${done} of ${total} corners in place`,
    stepTutorialOfapelPlace: (done: number, total: number) =>
      `${done} of ${total} corners in place`,
    stepTutorialOfapelTwist: (done: number, total: number) =>
      `${done} of ${total} corners turned right`,
    stepTutorialOfapelEdges: (done: number, total: number) => `${done} of ${total} edges in place`,
    stepTutorialOfapelFinish: (done: number, total: number) => `${done} of ${total} edges in place`,
  },
  titles: {
    stepTutorialOfapelCorner: 'Place the bottom corners',
    stepTutorialOfapelPlace: 'Place the top corners',
    stepTutorialOfapelTwist: 'Turn the top corners',
    stepTutorialOfapelEdges: 'Place the top edges',
    stepTutorialOfapelFinish: 'Finish with the middle slice',
  },
  hints: {
    stepTutorialOfapelCorner:
      'Place the first face’s four corners one by one, each by its case’s formula: on top, its bottom face to the side; on top, its bottom face up; down already but turned wrong.',
    stepTutorialOfapelPlace:
      'Place the top corners two by two, even turned wrong: two corners in their places already stay on one side, the formula swaps the other two.',
    stepTutorialOfapelTwist:
      'One formula and its mirror turn the top corners: played once or more, they make the top face, then a turn of the top puts the corners back in place.',
    stepTutorialOfapelEdges:
      'Bring the top edges up one by one from the middle layer: get the two corners that will frame it above it, then the formula. The middle layer turns along: it is set at the end.',
    stepTutorialOfapelFinish:
      'Only the middle layer is left: the cube is tipped over to make it the upright middle slice, then its edges and centers are placed with a few formulas turning only that slice and the top face.',
  },
}
