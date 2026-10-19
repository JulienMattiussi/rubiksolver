import type { TutorialTexts } from '../../tutorialTexts'

export const CUBE3_EN: TutorialTexts = {
  checks: {
    stepHoldCube: () => 'Check you hold the cube as shown.',
    stepTutorialTopCross: (done: number) => `Check there are now ${done + 1} white faces up.`,
    stepTutorialTopEdges: (done: number) =>
      done === 1
        ? 'Check one white edge now faces its center.'
        : `Check ${done} white edges now face their centers.`,
    stepTutorialTopCorners: (done: number) =>
      done === 1
        ? 'Check one white corner is now in its place.'
        : `Check ${done} white corners are now in their place.`,
    stepTutorialTopTwist: () => 'Check every corner has its white up: the cube is solved.',
  },
  figures: {
    figureDot: 'Spot the white on top: a dot in the middle, no white edge up.',
    figureL: 'Spot the white on top: an L, held back and left.',
    figureLine: 'Spot the white on top: a line, held left to right.',
    figureEdgesTurn:
      'Spot the white edges: one turn of the top lines them all up with their centers.',
    figureEdgesSide: 'Spot the two white edges lined up with their centers, side by side.',
    figureEdgesFacing:
      'Spot the white edges lined up with their centers: two facing each other, or none.',
    figureCornersOne:
      'Spot the white corner already in its place, even turned wrong: it stays front right.',
    figureCornersNone: 'No white corner is in its place yet: the formula will place one.',
    figureCornersTwist:
      'Spot the white corners whose white is not up: each comes front right to be turned.',
  },
  progress: {
    stepTutorialCross: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} in place`,
    stepTutorialCorner: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
    stepTutorialMiddle: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} in place`,
    stepTutorialTopCross: (done: number, total: number) =>
      `${done} of ${total} white edge${total > 1 ? 's' : ''} up`,
    stepTutorialTopEdges: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} in place`,
    stepTutorialTopCorners: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
    stepTutorialTopTwist: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} white up`,
  },
  titles: {
    stepHoldCube: 'Hold the cube',
    stepTutorialCross: 'Build the yellow cross',
    stepTutorialCorner: 'Place the yellow corners',
    stepTutorialMiddle: 'Place the middle edges',
    stepTutorialTopCross: 'Build the white cross',
    stepTutorialTopEdges: 'Place the white edges',
    stepTutorialTopCorners: 'Place the white corners',
    stepTutorialTopTwist: 'Turn the white corners',
  },
  hints: {
    stepHoldCube:
      'The centers are not where the tutorial expects them: turn the cube in your hands to put them there, turning no face.',
    stepTutorialCross: 'Place the cube’s four yellow edges one by one.',
    stepTutorialCorner: 'Place the four yellow corners one by one, yellow down.',
    stepTutorialMiddle:
      'Place the second layer’s four edges one by one, those with neither yellow nor white.',
    stepTutorialTopCross: 'Turn the top edges so all their white faces point up.',
    stepTutorialTopEdges: 'Place each white edge above the center of its color.',
    stepTutorialTopCorners: 'Place each white corner between its three centers, even turned wrong.',
    stepTutorialTopTwist:
      'Turn each white corner so its white is up. The first layer comes apart on the way: go on, it comes back at the end.',
  },
}
