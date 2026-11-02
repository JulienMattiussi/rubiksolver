import type { TutorialTexts } from '../../tutorialTexts'

export const TOWER_EN: TutorialTexts = {
  holding: {
    tower: (color: string, down: string) =>
      `Hold the tower with the side that will be ${color} facing you, and the one that will be ${down} at the bottom.`,
  },
  checks: {
    stepTowerShape: (done: number) =>
      done === 8
        ? 'Check that every bar stands up: the tower is back in shape.'
        : `Check that ${done} bar${done > 1 ? 's' : ''} of 8 now ${done > 1 ? 'stand' : 'stands'} up. The tower only gets its shape back once all eight stand.`,
  },
  figures: {
    figureTowerPivot:
      'Find the lying bars: if need be, a wide turn brings two of them to the top front, then the formula pivots them in one go.',
    figureTowerTurn:
      'Turn a half of the tower: its bars tip over with it, and lying bars stand up.',
  },
  terms: {
    termSlimEdge:
      'An **edge**: a piece with two faces, in the middle layer of the tower. There are four.',
    termSlimMiddle:
      'A **middle turn**: only the middle layer turns, between the top and the bottom.',
    termTowerCorner:
      'A **corner**: a piece with three faces, at both ends of the tower, four at the top and four at the bottom.',
    termTowerMiddle:
      'A **middle**: a piece with two faces, in the middle of the tower. The two middles of a column are twins: the same colors.',
    termTowerBar:
      'A **bar**: a corner and the middle stuck to it. As long as only halves of the tower turn, they move together.',
    termTowerInner: 'The **inner Pocket**: the eight middles, solved like a 2x2.',
    termTowerOuter: 'The **outer Pocket**: the eight corners, solved the same way next.',
    termTowerWide:
      'A **wide turn**: a whole half of the tower turns. It is always possible, even when it bends the tower out of shape.',
    termTowerTop:
      'A **layer turn**: only the top (or bottom) layer turns, possible when it is a full square.',
  },
  progress: {
    stepSlimBottom: (done: number, total: number) =>
      `${done} corner${done > 1 ? 's' : ''} of ${total} in place`,
    stepSlimTop: (done: number, total: number) =>
      `${done} corner${done > 1 ? 's' : ''} of ${total} in place`,
    stepSlimEdges: (done: number, total: number) =>
      `${done} edge${done > 1 ? 's' : ''} of ${total} in place`,
    stepTowerShape: (done: number, total: number) =>
      `${done} bar${done > 1 ? 's' : ''} of ${total} standing`,
    stepTowerInnerDown: (done: number, total: number) =>
      `${done} middle${done > 1 ? 's' : ''} of ${total} in place`,
    stepTowerInnerUp: (done: number, total: number) =>
      `${done} middle${done > 1 ? 's' : ''} of ${total} in place`,
    stepTowerOuterDown: (done: number, total: number) =>
      `${done} corner${done > 1 ? 's' : ''} of ${total} in place`,
    stepTowerOuterUp: (done: number, total: number) =>
      `${done} corner${done > 1 ? 's' : ''} of ${total} in place`,
  },
  titles: {
    stepSlimBottom: 'Place the bottom corners',
    stepSlimTop: 'Place the top corners',
    stepSlimEdges: 'Place the middle edges',
    stepTowerShape: 'Get the tower back in shape',
    stepTowerInnerDown: 'Place the bottom middles',
    stepTowerInnerUp: 'Place the top middles',
    stepTowerOuterDown: 'Place the bottom corners',
    stepTowerOuterUp: 'Place the top corners',
  },
  hints: {
    stepSlimBottom:
      'Place the four bottom corners, one at a time, with a few turns: no formula at this step, everyone does it their own way.',
    stepSlimTop:
      'The bottom corners stay in place. Two opposite top corners swap with a formula played three times, two neighboring ones with another, played once. Turn the top first if need be.',
    stepSlimEdges:
      'Only the middle edges are left. A formula swaps them two by two; another, played three times, swaps two neighboring edges. The corners no longer move.',
    stepTowerShape:
      'Stand the lying bars up, two at a time, with wide turns: the tower gets its shape back.',
    stepTowerInnerDown:
      'The inner Pocket is solved like a 2x2, with wide turns: bring each bottom middle down to its place.',
    stepTowerInnerUp:
      'Swap the top middles two at a time, with wide turns, until the inner Pocket is solved.',
    stepTowerOuterDown:
      'The same for the outer Pocket, with layer turns: bring the bottom corners down. They come down two by two: the formula turns the inner Pocket’s front half over, the next puts it back.',
    stepTowerOuterUp: 'Swap the top corners two at a time: the tower is then solved.',
  },
}
