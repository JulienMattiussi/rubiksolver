import type { TutorialTexts } from '../../tutorialTexts'

export const FLAT_EN: TutorialTexts = {
  holding: {
    ghost: (piece: string) => `Hold the Floppy Ghost flat facing you, ${piece} top left.`,
  },
  checks: {
    stepTutorialFloppyCross: (done: number) =>
      done === 4
        ? 'Check that each face shows a cross of its center’s color.'
        : 'Check that the edge flipped: its bottom face has the bottom center’s color.',
    stepTutorialFloppyCycle: (done: number) =>
      done === 4
        ? 'Check that each corner sits between the sides of its colors: the Floppy is solved.'
        : 'Check that the corner reached its place, the edges and the corners already placed untouched.',
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
    termGhostCorner:
      'A **corner**: a piece between two points of the star, on a border of the square. There are five, A to E.',
    termGhostEdge:
      'An **edge**: a point of the star. It never leaves its place: a turn only flips it. There are five, 1 to 5.',
    termGhostTurn:
      'A **turn** flips a whole side over: its edge flips in place, its two corners swap and flip.',
    termHalfTurn:
      'A **half turn**: the only way to turn a side. The side flips over to the other face.',
  },
  progress: {
    stepTutorialFloppyCross: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} the right way up`,
    stepTutorialFloppyCycle: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
    stepTutorialGhostCorners: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
    stepTutorialGhostTwist: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} the right way up`,
    stepTutorialGhostEdges: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} the right way up`,
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
    stepTutorialFloppyCross: 'Make the cross',
    stepTutorialFloppyCycle: 'Place the corners',
    stepTutorialGhostCorners: 'Place the corners',
    stepTutorialGhostTwist: 'Turn the corners over',
    stepTutorialGhostEdges: 'Flip the edges',
    stepTutorialFloppyCorners: 'Place the corners',
    stepTutorialFlatCorners: 'Place the corners',
    stepTutorialFloppyEdges: 'Flip the edges',
    stepTutorialFlatEdge: 'Flip the bottom edge',
  },
  hints: {
    stepTutorialFloppyCross:
      'The edges never leave their place: a half turn of their side only flips them. Flip the ones upside down one by one, to make on each face a cross of its center’s color.',
    stepTutorialFloppyCycle:
      'With the cross done, a formula of four half turns cycles three corners without touching the edges. Hold the corner’s place on your front right: depending on where the corner is, one of the formulas brings it there. Place one corner this way, then turn the Floppy a side round for the next: once two corners are placed, the last two are too.',
    stepTutorialGhostCorners:
      'Bring the corners to their places one by one, either way up: by a turn, or by a formula of four turns sending three corners round, played from the side it takes.',
    stepTutorialGhostTwist:
      'The corners are in place; those upside down turn over two at a time, side by side, by a formula of eight turns (it flips two edges too, seen to next).',
    stepTutorialGhostEdges:
      'The edges upside down are left: a formula of six turns flips two side by side, touching nothing else.',
    stepTutorialFloppyCorners:
      'The edges never leave their place: they tell each side’s color. Bring the corners one by one between the sides of their colors, in a few half turns keeping the corners placed.',
    stepTutorialFlatCorners:
      'The top edge never leaves its row: it tells how to hold the puzzle, white up, its front color facing you. Bring the corners one by one to their places, in a few half turns keeping those placed; the last one gets there by itself.',
    stepTutorialFloppyEdges:
      'The corners are done, but some edges may be upside down. A formula of six half turns flips them two at a time, touching nothing else.',
    stepTutorialFlatEdge:
      'The corners are done; the bottom edge may still be upside down. A formula of six half turns flips it alone.',
  },
}
