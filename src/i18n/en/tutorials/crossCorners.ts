import type { TutorialTexts } from '../../tutorialTexts'

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

export const CROSS_CORNERS_EN: TutorialTexts = {
  checks: {
    stepTutorialCrossCornersMiddle: (done: number) =>
      done === 4
        ? 'Check the four middle edges are now in their slots (one turned over is turned next).'
        : 'Check the cross has not moved: one more middle edge is nearer its place, even turned over.',
    stepTutorialCrossCornersTopEdges: (done: number) =>
      done === 4
        ? 'Check every edge is now in its place.'
        : 'Check the cross and the middle edges have not moved.',
    stepTutorialCrossCornersBottom: (done: number) =>
      done === 4
        ? 'Check the four bottom corners are in their places, even turned wrong.'
        : 'Check the edges have not moved: only corners go round.',
    stepTutorialCrossCornersTop: (done: number) =>
      done === 4
        ? 'Check the eight corners are in their places, even turned wrong.'
        : 'Check the edges have not moved: only corners go round.',
  },
  placed: {
    stepTutorialCrossCornersTwist: (piece: string) => `Check ${piece} is now turned right.`,
  },
  figures: {
    figureCrossCornersTop:
      'Turn the face opposite the cross to bring the edge where it goes (nothing there is done yet).',
    figureCrossCornersSwap:
      'The formula swaps the top’s front and left edges (turning the right one over on the way).',
    figureCrossCornersSwapTwice:
      'Played twice in a row, the formula turns the top’s front and left edges over in place.',
    figureCrossCornersTopSwap:
      'Turn the face opposite the cross to bring the edge where it goes, then the formula swaps the top’s front and left edges (turning the right one over on the way).',
    figureCrossCornersTopSwapTwice:
      'Turn the face opposite the cross to bring the edge where it goes, then the formula, played twice in a row, turns the top’s front and left edges over in place.',
    figureCrossCornersCycle:
      'The formula cycles three corners of the front face: the bottom left one goes up to the top left, which goes to the top right, which goes down to the bottom left.',
  },
  progress: {
    stepTutorialCrossCornersMiddle: (done: number, total: number) =>
      `${plural(done, 'edge')} out of ${total} in ${done > 1 ? 'their' : 'its'} slot`,
    stepTutorialCrossCornersTopEdges: (done: number, total: number) =>
      `${plural(done, 'edge')} out of ${total} in place`,
    stepTutorialCrossCornersBottom: (done: number, total: number) =>
      `${plural(done, 'corner')} out of ${total} in its place`,
    stepTutorialCrossCornersTop: (done: number, total: number) =>
      `${plural(done, 'corner')} out of ${total} in its place`,
    stepTutorialCrossCornersTwist: (done: number, total: number) =>
      `${plural(done, 'corner')} out of ${total} turned right`,
  },
  titles: {
    stepTutorialCrossCornersMiddle: 'Place the middle edges',
    stepTutorialCrossCornersTopEdges: 'Place the top edges',
    stepTutorialCrossCornersBottom: 'Place the bottom corners',
    stepTutorialCrossCornersTop: 'Place the top corners',
    stepTutorialCrossCornersTwist: 'Turn the corners',
  },
  hints: {
    stepTutorialCrossCornersMiddle:
      'A single formula: it swaps the top’s front and left edges, and played twice turns them over in place. Turn the cube to bring up the face of the edge to place, and turn the face opposite the cross to bring it along.',
    stepTutorialCrossCornersTopEdges:
      'The same formula, the face opposite the cross up: it swaps two neighbouring edges, played twice it turns them over. The corners come next.',
    stepTutorialCrossCornersBottom:
      'A new formula: it cycles three corners of the front face without touching the edges. Place the four bottom corners, even turned wrong: the last step turns them right.',
    stepTutorialCrossCornersTop:
      'The same formula places the top corners, the cube held so that the bottom ones end in their places.',
    stepTutorialCrossCornersTwist:
      'A last formula: it turns the top’s two corners on the right in place, one each way. Click a corner turned wrong to pick it: the cube turns to bring it there.',
  },
}
