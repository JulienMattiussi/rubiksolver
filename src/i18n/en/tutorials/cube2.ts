import type { TutorialTexts } from '../../tutorialTexts'
import { listEn } from '../list'

export const CUBE2_EN: TutorialTexts = {
  checks: {
    stepTutorialTurnOver2: () => 'Check a yellow corner now has its yellow down.',
    stepTutorialTopFace2: (done: number, pieces: readonly string[] = []) =>
      done === 0
        ? 'No corner has its white up yet: the next formula sees to it.'
        : pieces.length === 1
          ? `Check ${pieces[0]} now has its white up.`
          : pieces.length > 1
            ? `Check ${listEn(pieces)} now have their white up.`
            : `Check ${done} corners now have their white up.`,
    stepTutorialTopCorners2: () => 'Check every corner is in its place: the cube is solved.',
  },
  figures: {
    figureTopNone: 'Spot the top corners: none has its white up.',
    figureTopOne: 'Spot the top corners: only one has its white up.',
    figureTopOneDetour:
      'Spot the top corners: only one has its white up. Here no formula as short keeps it: this one undoes it, but leads straight to the white face.',
    figureTopTwo: 'Spot the top corners: two have their white up.',
    figureTopTwoDetour:
      'Spot the top corners: two have their white up. Here no formula as short keeps them: this one leaves only one, but leads straight to the white face.',
    figureCornersTurn:
      'The white corners already follow each other in the right order: one turn of the top places them.',
    figureCornersAdjacent:
      'Two neighboring corners must be swapped: brought to the right, the formula swaps the two right corners.',
    figureCornersDiagonal:
      'Two corners across must be swapped: that is the 2x2 parity, which a formula of its own fixes.',
  },
  progress: {
    stepTutorialCorner2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} placed`,
    stepTutorialTopFace2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} white up`,
    stepTutorialTopCorners2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
  },
  titles: {
    stepTutorialTurnOver2: 'Turn the cube over, yellow down',
    stepTutorialCorner2: 'Place the yellow corners',
    stepTutorialTopFace2: 'Build the white face',
    stepTutorialTopCorners2: 'Place the white corners',
  },
  hints: {
    stepTutorialTurnOver2:
      'A 2x2 has no centers: a yellow corner with its yellow down is the landmark. None has its yellow down: turn the cube over to bring one. No face turns.',
    stepTutorialCorner2:
      'A 2x2 has no centers: a yellow corner already yellow down is the landmark, and the sides’ colors are read on it. Place the other yellow corners one by one around it, yellow down.',
    stepTutorialTopFace2: 'Turn the top corners so their white is up.',
    stepTutorialTopCorners2:
      'Place each white corner in its place. Two corners across to swap is the 2x2 parity: it has a formula of its own.',
  },
}
