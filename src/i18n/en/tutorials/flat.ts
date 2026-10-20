import type { TutorialTexts } from '../../tutorialTexts'

export const FLAT_EN: TutorialTexts = {
  checks: {
    stepTutorialFloppyEdges: (done: number) =>
      done === 4
        ? 'Check the four edges show their color on each side: the Floppy is solved.'
        : 'Check two edges flipped over, the corners still in place.',
    stepTutorialFlatEdge: () => 'Check the bottom edge flipped over, the corners still in place.',
  },
  figures: {
    figureFloppyPair:
      'Two edges side by side are upside down: hold them in front and on the right, the formula flips both.',
    figureFloppyOpposite:
      'Two opposite edges are upside down: hold one in front. The formula flips it with the right one, which leaves two edges side by side.',
    figureFloppyFour:
      'All four edges are upside down: the formula flips two, leaving two side by side.',
    figureFlatEdge:
      'The bottom edge shows the back’s color: the formula flips it alone, the corners coming back to their places.',
  },
  terms: {
    termFlatCorner:
      'A **corner**: a piece at the end of a row, with two sides showing besides the two big faces.',
    termFlatEdge:
      'An **edge**: a piece in the middle of a border. It never leaves its place: a half turn only flips it.',
    termHalfTurn:
      'A **half turn**: the only way to turn a side. The side flips over to the other face.',
  },
  progress: {
    stepTutorialFloppyCorners: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
    stepTutorialFlatCorners: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
    stepTutorialFloppyEdges: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} the right way up`,
    stepTutorialFlatEdge: (done: number) =>
      done ? 'Bottom edge the right way up' : 'Bottom edge to flip',
  },
  titles: {
    stepTutorialFloppyCorners: 'Place the corners',
    stepTutorialFlatCorners: 'Place the corners',
    stepTutorialFloppyEdges: 'Flip the edges',
    stepTutorialFlatEdge: 'Flip the bottom edge',
  },
  hints: {
    stepTutorialFloppyCorners:
      'The edges never leave their place: they tell each side’s color. Bring the corners one by one between the sides of their colors, in a few half turns keeping the corners placed.',
    stepTutorialFlatCorners:
      'The top edge never leaves its row: it tells how to hold the puzzle, white up, its front color facing you. Bring the corners one by one to their places, in a few half turns keeping those placed; the last one gets there by itself.',
    stepTutorialFloppyEdges:
      'The corners are done, but some edges may be upside down. A formula flips them two at a time, touching nothing else: (F2 R2) three times.',
    stepTutorialFlatEdge:
      'The corners are done; the bottom edge may still be upside down. A formula of six half turns flips it alone.',
  },
}
