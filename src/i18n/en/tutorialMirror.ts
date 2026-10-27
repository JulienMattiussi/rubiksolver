import type { TUTORIAL_MIRROR_FR } from '../fr/tutorialMirror'
import { listEn } from './list'
import { PIECES_EN } from './tutorial'

const INTRO =
  'On a mirror cube every face has the same color: you tell them by their thickness, from very thin to very thick.'

export const TUTORIAL_MIRROR_EN: typeof TUTORIAL_MIRROR_FR = {
  thickness: {
    O: 'very thin',
    Y: 'thin',
    G: 'less thin',
    B: 'less thick',
    W: 'thick',
    R: 'very thick',
  },
  piece: (kind, names) =>
    kind === 'center'
      ? `the center of the ${names[0]} face`
      : `the ${PIECES_EN[kind] ?? 'piece'} with ${listEn(names)} faces`,
  terms: {
    termCenter:
      'A **center**: the piece in the middle of a side, they have one face showing. Centers never move: each gives its side’s thickness.',
    termCenter4:
      'A **center**: one of the four pieces in the middle of a side, they have one face showing.',
    termWing: 'A **wing**: a piece with two faces, on a border. Each pair of thicknesses has two.',
    termEdge4:
      'An **edge**: two wings of the same thicknesses, side by side and the same way round.',
  },
  thicknessTerm: (name, first) =>
    `${first ? `${INTRO} ` : ''}In blue, the pieces with a **${name}** face.`,
  thicknessIntro: INTRO,
  facing: (name, down) => `Turn the ${name} face toward you, the ${down} face down.`,
  checkFigure: 'Check the new figure the thick faces draw on top.',
  checks: {
    stepTutorialFace2: () => 'Check one more corner now has its thin face up.',
    stepTutorialLayer2: () =>
      'Check the thin face’s corners follow each other: two neighbors show the same thickness on the side they share.',
    stepTutorialTopCross: (done: number) => `Check there are now ${done + 1} thick faces up.`,
    stepTutorialTopEdges: (done: number) =>
      done === 1
        ? 'Check one top edge is now lined up with its center.'
        : `Check ${done} top edges are now lined up with their center.`,
    stepTutorialTopCorners: (done: number) =>
      done === 1
        ? 'Check one top corner is now in its place.'
        : `Check ${done} top corners are now in their place.`,
    stepTutorialTopTwist: () => 'Check every corner has its thick face up: the cube is solved.',
    stepTutorialTopFace2: (done: number, pieces: readonly string[] = []) =>
      done === 0
        ? 'No corner has its thick face up yet: the next formula sees to it.'
        : pieces.length === 1
          ? `Check ${pieces[0]} now has its thick face up.`
          : pieces.length > 1
            ? `Check ${listEn(pieces)} now have their thick face up.`
            : `Check ${done} corners now have their thick face up.`,
  },
  figures: {
    figureDot: 'Spot the thick faces on top: the center alone, no edge with its thick face up.',
    figureL: 'Spot the thick faces on top: an L, held back left.',
    figureLine: 'Spot the thick faces on top: a line, held left to right.',
    figureEdgesTurn: 'Spot the top edges: one turn of the top lines them all up with their center.',
    figureEdgesSide: 'Spot the two top edges lined up with their center, side by side.',
    figureEdgesFacing:
      'Spot the top edges lined up with their center: two facing each other, or none.',
    figureCornersOne:
      'Spot the top corner already in its place, even turned wrong: it stays front right.',
    figureCornersNone: 'No top corner is in its place yet: the formula will place one.',
    figureCornersTwist:
      'Spot the top corners whose thick face is not up: each comes front right to be turned.',
    figureLayer2Once:
      'Spot the thin face’s corners: formula 1 cycles three of them and keeps the back left one. Once is enough here.',
    figureLayer2Twice:
      'Spot the thin face’s corners: formula 1 cycles three of them and keeps the back left one. It will take two.',
    figureTurnOver2:
      'The thin face is done: turn the cube over, thin face down. The thick face is now on top.',
    figureFace2Case1:
      'Case 1: only one corner has its thick face up. Hold the cube as shown: formula 2.',
    figureFace2Case2:
      'Case 2: only one corner has its thick face up, the others turned the other way. Hold the cube as shown: formula 3.',
    figureFace2Case3:
      'Case 3: no corner has its thick face up, two thick faces in front and two at the back. Formula 2 twice.',
    figureFace2Case4:
      'Case 4: no corner has its thick face up, two thick faces on one side only. Formula 2, a quarter turn of the top, then formula 2.',
    figureFace2Case5:
      'Case 5: two corners across have their thick face up. Formula 2, a half turn of the top, then formula 3.',
    figureFace2Case6:
      'Case 6: two neighboring corners have their thick face up, the other two turn it to opposite sides. Formula 2, a quarter turn of the top, then formula 3.',
    figureFace2Case7:
      'Case 7: two neighboring corners have their thick face up, the other two turn it to the same side. Formula 2, a quarter turn of the top, then formula 3.',
    figureCorners2Turn:
      'The top corners already follow each other: one turn of the top places them.',
    figureCorners2Once:
      'Spot the top corners: formula 1 cycles three of them and keeps the back left one. Once is enough here.',
    figureCorners2Twice:
      'Spot the top corners: formula 1 cycles three of them and keeps the back left one. It will take two.',
  },
  progress: {
    stepTutorialTopCross: (done: number, total: number) =>
      `${done} of ${total} edge${total > 1 ? 's' : ''} thick face up`,
    stepTutorialTopTwist: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} thick face up`,
    stepTutorialFace2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} thin face up`,
    stepTutorialTopFace2: (done: number, total: number) =>
      `${done} of ${total} corner${total > 1 ? 's' : ''} thick face up`,
  },
  titles: {
    stepTutorialCross: 'Build the cross of the thin face',
    stepTutorialCorner: 'Place the corners of the thin face',
    stepTutorialTopCross: 'Build the cross of the thick face',
    stepTutorialTopEdges: 'Place the top edges',
    stepTutorialTopCorners: 'Place the top corners',
    stepTutorialTopTwist: 'Turn the top corners',
    stepTutorialFace2: 'Build the thin face',
    stepTutorialLayer2: 'Place the corners of the thin face',
    stepTutorialTopFace2: 'Build the thick face',
    stepTutorialTopCorners2: 'Place the top corners',
  },
  hints: {
    stepTutorialOllParity4:
      'On a 4x4, an edge can end up alone upside down, which no 3x3 allows. It is flipped before building the thick side’s cross.',
    stepTutorialPllParity4:
      'On a 4x4, two edges can end up swapped alone, which no 3x3 allows. They are swapped before placing the top edges.',
    stepTutorialCenters4:
      'Gather each thickness’s four centers on their side one by one: the thin side down, the thick side up, then the four others around.',
    stepTutorialCross: 'Place the four edges with a thin face one by one, that face down.',
    stepTutorialCorner: 'Place the four corners with a thin face one by one, that face down.',
    stepTutorialMiddle:
      'Place the second layer’s four edges one by one, those with neither a thin nor a thick face.',
    stepTutorialTopCross: 'Turn the top edges so all their thick faces point up.',
    stepTutorialTopEdges:
      'Line each top edge up with the center of its face: same thickness, no step.',
    stepTutorialTopCorners: 'Place each top corner between its three centers, even turned wrong.',
    stepTutorialTopTwist:
      'Turn each top corner so its thick face is up. The first layer comes apart on the way: go on, it comes back at the end.',
    stepTutorialFace2:
      'Hold the cube thin face up. Bring the corners with a thin face up one by one, that face up, never mind the sides.',
    stepTutorialLayer2:
      'The thin face still on top, place its corners with formula 1: it cycles three top corners without turning them, the back left one staying put.',
    stepTutorialTopFace2:
      'Turn the cube over, thin face down, then turn the top corners so their thick face is up: seven cases, each with formula 2 or formula 3, or both.',
    stepTutorialTopCorners2:
      'Place each top corner in its place with formula 1, as those of the thin face.',
  },
}
