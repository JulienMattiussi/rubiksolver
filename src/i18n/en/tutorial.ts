import type { TUTORIAL_FR } from '../fr/tutorial'

/** Names in a sentence: "a, b and c". */
export const listEn = (names: readonly string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : (names[0] ?? '')

/** The kinds of pieces, named. */
export const PIECES_EN: Record<string, string> = {
  center: 'center',
  edge: 'edge',
  corner: 'corner',
  tip: 'tip',
}

export const TUTORIAL_EN: typeof TUTORIAL_FR = {
  button: 'Tutorial',
  buttonTitle: 'Learn to solve it step by step, picking the pieces to move',
  exit: 'Leave the tutorial',
  close: 'Close the tutorial',
  apply: 'Apply the formula',
  undo: 'Undo the move',
  finish: 'Complete the move',
  next: 'Next',
  alreadyDone: 'As things stand, the cubes this step moves are already in the right place.',
  alreadyDoneNext: 'On to the next step.',
  locked: 'Unavailable during the tutorial: leave it first',
  facing: (color: string, down: string) =>
    `Hold the ${color} center facing you, the ${down} center down.`,
  facingFace: (color: string, down: string) =>
    `Hold the ${color} side facing you, the ${down} side down.`,
  holding: {
    flat: (color: string, down: string) =>
      `Lay the pyramid flat on its ${down} side, the ${color} side facing you.`,
  },
  facingTitle: 'Turn the view to face it',
  piece: (kind, colors) => `the ${colors.join('-')} ${PIECES_EN[kind] ?? 'piece'}`,
  spot: (piece: string) => `Spot ${piece}.`,
  spotSwap: (piece: string, other: string) =>
    `Spot ${piece}, and ${other} which stands in its place.`,
  play: (count: number) =>
    count === 0
      ? 'Play the moves.'
      : count === 1
        ? 'Play this move:'
        : `Play these ${count} moves:`,
  repeat: (times: number) => `Then play these moves ${times} times:`,
  round: (n: number, times: number) => `(round ${n} of ${times})`,
  thenPlay: (count: number) =>
    count === 1 ? 'Then play this move:' : `Then play these ${count} moves:`,
  thenSequence: 'Then play this sequence:',
  sequence: (count: number) => `Play this sequence of ${count} moves:`,
  repeatAll: (count: number, times: number) =>
    `Play these ${count} moves, ${times} times in a row:`,
  check: (piece: string) => `Check the new positions: ${piece} is in its place.`,
  checkAll: 'Check the new positions: the pieces are in their place.',
  checkFigure: 'Check the new figure the white draws on top.',
  checks: {
    stepTutorialTurnOver2: () => 'Check a yellow corner now has its yellow down.',
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
    stepTutorialTopFace2: (done: number, pieces: readonly string[] = []) =>
      done === 0
        ? 'No corner has its white up yet: the next formula sees to it.'
        : pieces.length === 1
          ? `Check ${pieces[0]} now has its white up.`
          : pieces.length > 1
            ? `Check ${listEn(pieces)} now have their white up.`
            : `Check ${done} corners now have their white up.`,
    stepTutorialPyraTop: (done: number) =>
      done === 3
        ? 'Check the three top edges are between their sides, even flipped.'
        : `Check ${done} top edge${done > 1 ? 's are' : ' is'} now between its sides.`,
    stepTutorialPyraFlip: (done: number) =>
      done === 6
        ? 'Check every edge is the right way round: the Pyraminx is solved.'
        : 'Check two more edges are now the right way round.',
    stepTutorialTopCorners2: () => 'Check every corner is in its place: the cube is solved.',
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
    figureTopNone: 'Spot the top corners: none has its white up.',
    figureTopOne: 'Spot the top corners: only one has its white up.',
    figureTopOneDetour:
      'Spot the top corners: only one has its white up. Here no formula as short keeps it: this one undoes it, but leads straight to the white face.',
    figureTopTwo: 'Spot the top corners: two have their white up.',
    figureTopTwoDetour:
      'Spot the top corners: two have their white up. Here no formula as short keeps them: this one leaves only one, but leads straight to the white face.',
    figurePyraCycle:
      'Spot the top edges not between their sides: the formula turns the three round.',
    figurePyraFlip: 'Spot the edges the wrong way round: the formula flips two at a time.',
    figureCornersTurn:
      'The white corners already follow each other in the right order: one turn of the top places them.',
    figureCornersAdjacent:
      'Two neighboring corners must be swapped: brought to the right, the formula swaps the two right corners.',
    figureCornersDiagonal:
      'Two corners across must be swapped: that is the 2x2 parity, which a formula of its own fixes.',
  },
  glossary: 'The words',
  glossaryIntro:
    'This first, preliminary step is to learn and understand the words used to describe and handle the cube.',
  termCount: (n, total) => `Word ${n} of ${total}`,
  skipTerms: 'Skip',
  backToGlossary: 'Back to the words',
  terms: {
    termCenter:
      'A **center**: the piece in the middle of a side, one face showing. Centers never move: each gives its side’s color.',
    termEdge: 'An **edge**: a piece with two faces showing, between two centers.',
    termCorner: 'A **corner**: a piece with three faces showing, at a corner of the cube.',
    termTip:
      'A **tip**: the small piece at the end of each corner. It turns alone, taking nothing along.',
    termPyraCenter:
      'A **center**: the piece just under the tip, with three faces. It never leaves its corner: the centers tell each side’s color.',
    termPyraEdge: 'An **edge**: a piece with two faces, between two corners.',
    termLayer:
      'A **layer**: all that turns with a corner, its tip, its center and the three edges around.',
    termPyraClockwise:
      '**Clockwise**: it is the way a clock’s hands go, looking at the corner that turns, from in front of it.',
    termPyraCounterclockwise:
      '**Counterclockwise**: it is the opposite way to a clock’s hands, still looking at the corner that turns.',
    termClockwise:
      '**Clockwise**: it is the way a clock’s hands go, looking at the side that turns.',
    termCounterclockwise:
      '**Counterclockwise**: it is the opposite way to a clock’s hands, still looking at the side that turns.',
  },
  legendMoved:
    'The hatched cubes will be moved by the formula, with no effect on the expected result.',
  noFormula: 'No formula gets there without disturbing the pieces already placed.',
  solved: 'Solved, well done!',
  stage: (n: number, total: number) => `Step ${n} of ${total}`,
  beforeStages: 'Before starting',
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
    stepTutorialCorner2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} placed`,
    stepTutorialTopFace2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} white up`,
    stepTutorialPyraCenters: (done: number, total: number) =>
      `${done} of ${total} center${total > 1 ? 's' : ''} in place`,
    stepTutorialPyraTips: (done: number, total: number) =>
      `${done} of ${total} tip${total > 1 ? 's' : ''} in place`,
    stepTutorialPyraBottom: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} in place`,
    stepTutorialPyraTop: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} between their sides`,
    stepTutorialPyraFlip: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} the right way round`,
    stepTutorialTopCorners2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} in place`,
  },
  titles: {
    stepRecenter: 'Put the centers back in place',
    stepTutorialCross: 'Build the yellow cross',
    stepTutorialCorner: 'Place the yellow corners',
    stepTutorialMiddle: 'Place the middle edges',
    stepTutorialTopCross: 'Build the white cross',
    stepTutorialTopEdges: 'Place the white edges',
    stepTutorialTopCorners: 'Place the white corners',
    stepTutorialTopTwist: 'Turn the white corners',
    stepTutorialTurnOver2: 'Turn the cube over, yellow down',
    stepTutorialCorner2: 'Place the yellow corners',
    stepTutorialTopFace2: 'Build the white face',
    stepTutorialPyraCenters: 'Turn the centers',
    stepTutorialPyraTips: 'Turn the tips',
    stepTutorialPyraBottom: 'Place the bottom edges',
    stepTutorialPyraTop: 'Place the top edges',
    stepTutorialPyraFlip: 'Flip the edges',
    stepTutorialTopCorners2: 'Place the white corners',
  },
  hints: {
    stepRecenter:
      'A middle slice moved the centers: they go back first, everything else is placed around them.',
    stepTutorialCross: 'Place the cube’s four yellow edges one by one.',
    stepTutorialCorner: 'Place the four yellow corners one by one, yellow down.',
    stepTutorialMiddle:
      'Place the second layer’s four edges one by one, those with neither yellow nor white.',
    stepTutorialTopCross: 'Turn the top edges so all their white faces point up.',
    stepTutorialTopEdges: 'Place each white edge above the center of its color.',
    stepTutorialTopCorners: 'Place each white corner between its three centers, even turned wrong.',
    stepTutorialTopTwist:
      'Turn each white corner so its white is up. The first layer comes apart on the way: go on, it comes back at the end.',
    stepTutorialTurnOver2:
      'A 2x2 has no centers: a yellow corner with its yellow down is the landmark. None has its yellow down: turn the cube over to bring one. No face turns.',
    stepTutorialCorner2:
      'A 2x2 has no centers: a yellow corner already yellow down is the landmark, and the sides’ colors are read on it. Place the other yellow corners one by one around it, yellow down.',
    stepTutorialTopFace2: 'Turn the top corners so their white is up.',
    stepTutorialPyraCenters:
      'Turn each corner’s layer until its center wears the colors of the three sides around it.',
    stepTutorialPyraTips: 'Turn each tip alone so it wears its center’s colors.',
    stepTutorialPyraBottom:
      'Place the three edges of the bottom side one by one, each between its two colors.',
    stepTutorialPyraTop: 'Place the three top edges between their sides, even flipped.',
    stepTutorialPyraFlip:
      'Flip the edges the wrong way round, two at a time: the Pyraminx is then solved.',
    stepTutorialTopCorners2:
      'Place each white corner in its place. Two corners across to swap is the 2x2 parity: it has a formula of its own.',
  },
}
