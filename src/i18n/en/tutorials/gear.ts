import type { TutorialTexts } from '../../tutorialTexts'

export const GEAR_EN: TutorialTexts = {
  checks: {
    stepGearEdges: (done: number) =>
      done === 12
        ? 'Check that every edge is between its two colors, even with its clips the wrong way round.'
        : 'Check that two pairs of edges have swapped places, the corners back home.',
    stepGearClips: (done: number) =>
      done === 12
        ? 'Check that every clip has its face’s color.'
        : 'Check that the clips of eight edges have turned over, nothing else moved.',
    stepGearSpins: (done: number) =>
      done === 12
        ? 'Check that every gear stands straight, the right way up: the Gear Cube is solved.'
        : 'Check that the slice’s four gears have pivoted a third of a turn.',
  },
  figures: {
    figureGearSwap:
      'Find the edges not between their colors: two moves of the same face turn the slice beside it a half turn, two pairs of edges swapped.',
    figureGearClips:
      'Find the edges whose clips are the wrong way round: the formula turns over those of eight edges, the gears back as they were.',
    figureGearSpin:
      'Find the gears standing askew: four moves of the same face pivot them a third of a turn, the whole slice at once.',
  },
  terms: {
    termGearCorner:
      'A **corner**: a piece with three faces, at each corner of the cube. They are placed first: they tell the color each face will take.',
    termGearCenter:
      'A **center**: the small square in the middle of each face. It is what you look at to hold the cube.',
    termGearEdge:
      'An **edge**: a piece in the middle of an edge of the cube, between two corners. It is a **gear**, a toothed wheel that pivots as the edge moves, and only fits back a half turn apart.',
    termGearClip:
      'A **clip**: the colored U under the gear, at the border of each face of an edge piece, two per edge. The clips follow the edge, not its pivot.',
    termGearMove:
      'A **move**: a half turn of a face. The middle layer beside it, its **slice**, turns a quarter the same way, its four gears pivoting.',
  },
  progress: {
    stepGearCorners: (done: number, total: number) =>
      `${done} corner${done > 1 ? 's' : ''} of ${total} in place`,
    stepGearEdges: (done: number, total: number) =>
      `${done} edge${done > 1 ? 's' : ''} of ${total} between its colors`,
    stepGearClips: (done: number, total: number) =>
      `${done} edge${done > 1 ? 's' : ''} of ${total} the right way round`,
    stepGearSpins: (done: number, total: number) =>
      `${done} gear${done > 1 ? 's' : ''} of ${total} straight`,
  },
  titles: {
    stepGearCorners: 'Place the corners',
    stepGearEdges: 'Place the edges',
    stepGearClips: 'Turn the clips over',
    stepGearSpins: 'Straighten the gears',
  },
  hints: {
    stepGearCorners:
      'Place the corners one by one, each with its colors on its faces: they tell the color each face takes.',
    stepGearEdges: 'Place each edge between its two colors, swapping edges two pairs at a time.',
    stepGearClips: 'Turn over the clips the wrong way round, so each has its face’s color.',
    stepGearSpins:
      'Pivot the gears standing askew, one slice at a time: the Gear Cube is then solved.',
  },
}
