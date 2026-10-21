import type { TutorialTexts } from '../../tutorialTexts'

export const SKEWB_EN: TutorialTexts = {
  holding: {
    skewb: (color: string) =>
      `Turn the Skewb without changing its top, to face the side that will be ${color}.`,
  },
  checks: {
    stepSkewbCenters: (done: number) =>
      done === 5
        ? 'Check that every center is now on its face.'
        : 'Check that the bottom and front centers have swapped, and the left and right ones too.',
    stepSkewbBottom: (done: number) =>
      done === 4
        ? 'Check that every bottom corner is turned right: the Skewb is solved.'
        : 'Check that the four bottom corners have turned, nothing else moved.',
  },
  placed: {
    stepSkewbTopPlaced: (piece: string, before: number, up: string) =>
      before === 0
        ? `Check that ${piece} now sits by the ${up} center.`
        : `Check that ${piece} now sits by the ${up} center, its side colors going with those of the top corners already placed.`,
  },
  figures: {
    figureSkewbCenters:
      'Find the centers not on their face: the formula swaps the bottom center with the front one, and the left and right centers with each other.',
    figureSkewbBottom:
      'Find the bottom corners turned wrong: the formula played twice turns all four of them, disturbing nothing else.',
  },
  terms: {
    termSkewbCorner:
      'A **corner**: a piece with three faces, at each corner of the cube. It turns a third of a turn, the whole half of the cube on its side with it.',
    termSkewbCenter:
      'A **center**: the square in the middle of each face. It tells the color its face will take, but it moves when a corner turns.',
    termSkewbClockwise:
      '**Clockwise**: the way a clock’s hands go, looking at the turning corner, face on.',
    termSkewbCounterclockwise:
      '**Counterclockwise**: the other way round, still looking at the turning corner.',
  },
  progress: {
    stepSkewbTopPlaced: (done: number, total: number) =>
      `${done} corner${done > 1 ? 's' : ''} of ${total} placed among them`,
    stepSkewbTopTwist: (done: number, total: number) =>
      `${done} corner${done > 1 ? 's' : ''} of ${total} turned right`,
    stepSkewbCenters: (done: number, total: number) =>
      `${done} center${done > 1 ? 's' : ''} of ${total} on its face`,
    stepSkewbBottom: (done: number, total: number) =>
      `${done} corner${done > 1 ? 's' : ''} of ${total} turned right`,
  },
  titles: {
    stepSkewbTopPlaced: 'Place the top corners',
    stepSkewbTopTwist: 'Turn the top corners',
    stepSkewbCenters: 'Place the centers',
    stepSkewbBottom: 'Turn the bottom corners',
  },
  hints: {
    stepSkewbTopPlaced:
      'The top center will not move again. Place around it the four corners with its color, turning only the bottom corners. A corner is placed when its side colors go with its neighbors’, even turned wrong: the side centers do not count yet, they are placed in step 3.',
    stepSkewbTopTwist:
      'Turn each top corner in place, held at the front right, so that the top center’s color is on top.',
    stepSkewbCenters:
      'Place each center on its face, by swapping the bottom center with the front one.',
    stepSkewbBottom:
      'Turn the bottom corners in place, four at a time, from one side then another: the Skewb is then solved.',
  },
}
