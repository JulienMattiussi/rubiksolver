import type { METHODS_FR } from '../fr/methods'

export const METHODS_EN: typeof METHODS_FR = {
  beginner: {
    name: 'Layer by layer',
    desc: 'The beginner’s method: layer by layer, with few formulas.',
  },
  ofapel: {
    name: 'Ofapel',
    desc: 'Corners before edges: the first face, the top corners, the top edges, then the end in the middle slice.',
  },
  cfop: {
    name: 'Fridrich (CFOP)',
    desc: 'The speedcubers’ method: two layers by corner-edge pairs, the last one in two algorithms.',
  },
  roux: {
    name: 'Roux',
    desc: 'Two blocks built on the sides, then everything else turning almost only M and U.',
  },
  petrus: {
    name: 'Petrus',
    desc: 'A block grown bigger, edges oriented early to finish both layers with R and U only.',
  },
  zz: {
    name: 'ZZ',
    desc: 'Every edge oriented from the start, so as never to turn F or B again.',
  },
  reduction: {
    name: 'Reduction (layer by layer)',
    desc: 'Group centers and edges so it behaves as a 3x3, then finish it layer by layer.',
  },
  reductionCfop: {
    name: 'Reduction (CFOP)',
    desc: 'Group centers and edges so it behaves as a 3x3, then finish it with CFOP.',
  },
  barrelLayers: {
    name: 'Layer by layer',
    desc: 'Like a 3x3 layer by layer; its middle edges, whose way round never shows, make the end easier.',
  },
  megaStar: {
    name: 'Extended star',
    desc: 'Like a Rubik’s Cube layer by layer, adding one neighboring face each step, the top last.',
  },
  ftoCornersFirst: {
    name: 'Corners, centers, edges',
    desc: 'One kind of piece after another, each by a 3-cycle that touches nothing else.',
  },
  skewbTopFirst: {
    name: 'Top first',
    desc: 'The top center never moves: the top first, then all the rest by turning the bottom.',
  },
  crystalCornersFirst: {
    name: 'Corners first',
    desc: 'Like the Megaminx layer by layer, but always placing corners before edges.',
  },
  aiBlocks: {
    name: 'Block method',
    desc: 'Bring it down to a Pocket: rebuild its eight blocks, then solve them as a 2x2x2.',
  },
  rbCenters: {
    name: 'Centers method',
    desc: 'Bring it down to a 3x3, laying its bars across so the slices it needs can turn.',
  },
  quarterEdgesFirst: {
    name: 'Edges first',
    desc: 'Each face only goes a quarter and back: every formula alternates faces.',
  },
  camoReduction: {
    name: 'Reduction to a Domino',
    desc: 'Put it back in shape and bring each edge’s wings together, down to a Domino.',
  },
  tower234Steps: {
    name: 'Corners, edges, equator',
    desc: 'Put it back in shape first, then solve it all with formulas that keep that shape.',
  },
  doubleDomino: {
    name: 'Double Domino',
    desc: 'Two nested Dominos, solved one after the other with the Domino’s formulas.',
  },
  towerReduction: {
    name: 'Reduction',
    desc: 'Group centers and edges to bring it down to a 3 wide tower, then finish it as one.',
  },
  twoPockets: {
    name: 'Two Pockets',
    desc: 'Two stacked Pockets: put it back in shape, then solve them one after the other.',
  },
  asPocket: {
    name: 'As a Pocket',
    desc: 'A Pocket in disguise: its eight pieces are a 2x2’s corners, and it is solved as one.',
  },
  fashionLaid: {
    name: 'Lay down, then two towers',
    desc: 'Lay all its pairs down to get a 3x3x5 back, then solve it as a tower.',
  },
  latchEdgesFirst: {
    name: 'Edges first',
    desc: 'The edges’ arrows lock faces: edges first, working around them.',
  },
  copterEdgesFirst: {
    name: 'Edges first',
    desc: 'Its edges never leave their slots: they set the colors, and the rest is put home around them.',
  },
  voidCornersFirst: {
    name: 'Bottom corners first',
    desc: 'A 3x3 without centers: the bottom corners set their colors, then it is finished as a 3x3.',
  },
  extendedCross: {
    name: 'Extended cross',
    desc: 'A 3x3 without corners: nothing but edges, placed by very simple commutators.',
  },
  extendedTriangle: {
    name: 'Extended triangle',
    desc: 'A first triangle, then all the others with two commutators; the last one does itself.',
  },
  octCornersFirst: {
    name: 'Corners first',
    desc: 'A 4x4 cut to an octahedron: each kind of piece by the commutators of a known cube.',
  },
  jingCornersFirst: {
    name: 'Corners first',
    desc: 'Corners first, a turn each, then the edges and centers by commutators.',
  },
  wingsFirst: {
    name: 'Wings then midges',
    desc: 'A big Pyraminx: the easy pieces first, then wings and midges by commutators.',
  },
  centersFirst: {
    name: 'Centers first',
    desc: 'Centers with a single turn each, then the edges with three formulas to learn.',
  },
  isolateFirst: {
    name: 'Isolate then permute',
    desc: 'Split the two colors between top and bottom, then sort it all with a single swap formula.',
  },
  puckIsolate: {
    name: 'Isolate then permute',
    desc: 'Split the numbered pieces from the others, then sort each layer by swapping pieces.',
  },
  twoStars: {
    name: 'Two stars',
    desc: 'Two nested 2-Star Prisms, solved one after the other with the same formula.',
  },
  equatorFirst: {
    name: 'Equator then corners',
    desc: 'Like a Domino standing up: the equator first, then the bottom and top corners.',
  },
  cornersFirst: {
    name: 'Corners then edges',
    desc: 'Corners then edges, each time by a formula that only touches what is left to do.',
  },
  gemCentersFirst: {
    name: 'Centers first',
    desc: 'Like a Pyraminx: match the centers by turning the squares, then sort the edges.',
  },
  vtoCentersFirst: {
    name: 'Centers then edges',
    desc: 'Like a Pyraminx: match the centers by turning the corners, then sort the edges.',
  },
  gearEquatorFirst: {
    name: 'Equator then corners',
    desc: 'The equator first, intuitively, then each kind of piece, the gears last.',
  },
  dinoCylLayers: {
    name: 'Layer by layer',
    desc: 'Layer by layer with a 3-cycle of edges; the corners, which never move, tell how to hold it.',
  },
  dinoLayers: {
    name: 'Layer by layer',
    desc: 'Layer by layer with one formula only, a 3-cycle of edges that stirs nothing else.',
  },
  rexEdgesFirst: {
    name: 'Edges, centers, petals',
    desc: 'Edges, centers, then petals, each formula stirring only what is left to do.',
  },
  gearCornersFirst: {
    name: 'Corners first',
    desc: 'The corners intuitively, then each kind of piece; the centers follow on their own.',
  },
  shapeFirst: {
    name: 'Shape then colors',
    desc: 'Back to a cube first, then the colors put back by the shortest algorithm.',
  },
  optimal: {
    name: 'Optimal',
    desc: 'The shortest possible solution, found by an exhaustive search.',
  },
  fromStart: {
    name: 'From START',
    desc: 'Go through the START position, where its formulas start from, to place every piece there.',
  },
  skewbFirst: {
    name: 'Skewb first',
    desc: 'Solve it as a Skewb first, then its edges and petals by commutators.',
  },
}
