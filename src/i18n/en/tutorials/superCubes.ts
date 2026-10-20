import type { TutorialTexts } from '../../tutorialTexts'

export const SUPER_CUBES_EN: TutorialTexts = {
  checks: {
    stepTutorialSuperMiddles: (done: number) =>
      done === 6
        ? 'Check the six middle centers are straight, their borders facing the right colors.'
        : 'Check the middle centers turned in place, the colors untouched.',
    stepTutorialSuperCenters: () =>
      'Check the three shimmering centers changed places, the colors untouched.',
  },
  figures: {
    figureSuperMiddles:
      'The middle centers turn in place: their borders tell how far. The formula turns two at once, or one a half turn, disturbing nothing else.',
    figureSuperCenter:
      'Spot the three shimmering centers: the formula sends them round, each taking the next one’s place, and touches nothing else.',
  },
  terms: {
    termBorder:
      'A **border**: on a super cube, each center wears the color of the side next to it on its edges. Solved, each border touches the side of its color: each center has a place of its own.',
  },
  progress: {
    stepTutorialSuperMiddles: (done: number, total: number) =>
      `${done} of ${total} middle center${total > 1 ? 's' : ''} straight`,
    stepTutorialSuperCenters: (done: number, total: number) =>
      `${done} of ${total} center${total > 1 ? 's' : ''} in their place`,
  },
  titles: {
    stepTutorialSuperMiddles: 'Straighten the middle centers',
    stepTutorialSuperCenters: 'Put each center in its place',
  },
  hints: {
    stepTutorialSuperMiddles:
      'The colors are done, but the middle centers may have turned in place. Slice formulas straighten them, two at once or one a half turn.',
    stepTutorialSuperCenters:
      'The colors are done: each center is on its side, but not always in its place. A formula swaps three centers round; repeat it until every border touches the side of its color.',
  },
}
