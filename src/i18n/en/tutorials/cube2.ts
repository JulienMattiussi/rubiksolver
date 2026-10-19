import type { TutorialTexts } from '../../tutorialTexts'
import { listEn } from '../list'

export const CUBE2_EN: TutorialTexts = {
  checks: {
    stepTutorialFace2: () => 'Check one more yellow corner now has its yellow up.',
    stepTutorialLayer2: () =>
      'Check the yellow corners follow each other: two neighbors show the same color on the side they share.',
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
    figureLayer2Once:
      'Spot the yellow corners: formula 1 cycles three of them and keeps the back left one. Once is enough here.',
    figureLayer2Twice:
      'Spot the yellow corners: formula 1 cycles three of them and keeps the back left one. It will take two.',
    figureTurnOver2:
      'The yellow face is done: turn the cube over, yellow down. White is now on top.',
    figureFace2Case1:
      'Case 1: only one corner has its white up. Hold the cube as shown: formula 2.',
    figureFace2Case2:
      'Case 2: only one corner has its white up, the others turned the other way. Hold the cube as shown: formula 3.',
    figureFace2Case3:
      'Case 3: no corner has its white up, two whites in front and two at the back. Formula 2 twice.',
    figureFace2Case4:
      'Case 4: no corner has its white up, two whites on one side only. Formula 2, a quarter turn of the top, then formula 2.',
    figureFace2Case5:
      'Case 5: two corners across have their white up. Formula 2, a half turn of the top, then formula 3.',
    figureFace2Case6:
      'Case 6: two neighboring corners have their white up, the other two turn it to opposite sides. Formula 2, a quarter turn of the top, then formula 3.',
    figureFace2Case7:
      'Case 7: two neighboring corners have their white up, the other two turn it to the same side. Formula 2, a quarter turn of the top, then formula 3.',
    figureCorners2Turn:
      'The white corners already follow each other: one turn of the top places them.',
    figureCorners2Once:
      'Spot the white corners: formula 1 cycles three of them and keeps the back left one. Once is enough here.',
    figureCorners2Twice:
      'Spot the white corners: formula 1 cycles three of them and keeps the back left one. It will take two.',
  },
  progress: {
    stepTutorialFace2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} yellow up`,
    stepTutorialLayer2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
    stepTutorialTopFace2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} white up`,
    stepTutorialTopCorners2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
  },
  titles: {
    stepTutorialFace2: 'Build the yellow face',
    stepTutorialLayer2: 'Place the yellow corners',
    stepTutorialTopFace2: 'Build the white face',
    stepTutorialTopCorners2: 'Place the white corners',
  },
  hints: {
    stepTutorialFace2:
      'Hold the cube yellow up. Bring the yellow corners up one by one, their yellow up, never mind the sides.',
    stepTutorialLayer2:
      'The yellow face still on top, place its corners with formula 1: it cycles three top corners without turning them, the back left one staying put.',
    stepTutorialTopFace2:
      'Turn the cube over, yellow down, then turn the top corners so their white is up: seven cases, each with formula 2 or formula 3, or both.',
    stepTutorialTopCorners2:
      'Place each white corner in its place with formula 1, as the yellow ones.',
  },
}
