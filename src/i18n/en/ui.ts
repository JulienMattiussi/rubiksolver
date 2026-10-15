import type { LayerKind } from '@/lib/core/moves'
import type { PyraLayer } from '@/lib/puzzles/pyramid/pyraminx'
import type { GhostSide, MegaFace, PyraVertex, RainbowCorner } from '@/lib/core/types'
import {
  CORNER_NAMES_EN,
  describeEn,
  FACE_NAMES_EN,
  MEGA_FACE_NAMES_EN,
  SIDE_NAMES_EN,
  DINO_CORNER_NAMES_EN,
  FTO_FACE_NAMES_EN,
  TRIANGLE_NAMES_EN,
  STAR_LAYER_EN,
  type StarLayer,
} from '../moveSentences'
import type { UI_FR } from '../fr/ui'

export const UI_EN: typeof UI_FR = {
  title: 'Rubik Solver',
  madeWith: { before: 'Made with', love: 'love', by: 'by' },
  moves: 'Turns',
  scramble: 'Scramble',
  solve: 'Solve',
  computing: 'Computing the solution…',
  reset: 'Reset',
  stop: 'Stop',
  speed: 'Speed',
  statusSolved: 'Solved',
  statusReady: 'Ready',
  statusPlaying: 'Animating',
  statusSolving: 'Solving',
  solutionCount: (n: number) => `${n} turn${n > 1 ? 's' : ''}`,
  language: 'Language',
  notation: 'Notation',
  recenter: 'Recenter view',
  notationTitles: {
    us: 'International notation (U D L R F B)',
    fr: 'French notation (H B G D F Ar)',
  },
  faceNames: FACE_NAMES_EN,
  moveTitle: (faceName: string, clockwise: boolean, kind: LayerKind = 'outer') => {
    const target =
      kind === 'slice'
        ? `the inner slice of the ${faceName}`
        : kind === 'slice3'
          ? `the third layer from the ${faceName}`
          : kind === 'wide'
            ? `both layers of the ${faceName}`
            : kind === 'wide3'
              ? `the three layers of the ${faceName}`
              : `the ${faceName}`
    return `Turn ${target} ${clockwise ? 'clockwise' : 'counter-clockwise'}`
  },
  moveTitleHalf: (faceName: string) => `Turn the ${faceName} a half turn`,
  starTurnTitle: (layer: StarLayer, clockwise: boolean) =>
    `Turn the ${STAR_LAYER_EN[layer]} layer one piece ${clockwise ? 'clockwise' : 'counterclockwise'}`,
  slashTitle: 'Slash: flip the right half',
  gearTurnTitle: (faceName: string, clockwise: boolean) =>
    `Half turn of the ${faceName} ${clockwise ? 'clockwise' : 'counter-clockwise'} (the slice follows a quarter)`,
  megaTurnTitle: (face: MegaFace, clockwise: boolean) =>
    `Turn ${MEGA_FACE_NAMES_EN[face]} a fifth ${clockwise ? 'clockwise' : 'counter-clockwise'}`,
  megaUpper: 'Upper half',
  megaLower: 'Lower half',
  ghostTurnTitle: (side: GhostSide) => `Flip ${SIDE_NAMES_EN[side]} over (half turn)`,
  puckTurnTitle: (layer: 'U' | 'D', clockwise: boolean) =>
    `Turn the ${layer === 'U' ? 'top' : 'bottom'} disc one notch ${clockwise ? 'clockwise' : 'counterclockwise'}`,
  puckSlashTitle: 'Pivot: flip the right half over',
  rainbowTurnTitle: (triangle: RainbowCorner, clockwise: boolean) =>
    `Turn ${TRIANGLE_NAMES_EN[triangle]} a third ${clockwise ? 'clockwise' : 'counter-clockwise'}`,
  dinoTurnTitle: (corner: RainbowCorner, clockwise: boolean) =>
    `Turn ${DINO_CORNER_NAMES_EN[corner]} a third ${clockwise ? 'clockwise' : 'counter-clockwise'}`,
  ftoTurnTitle: (face: RainbowCorner, clockwise: boolean, slice: boolean) =>
    `Turn ${slice ? `the slice of ${FTO_FACE_NAMES_EN[face]}` : FTO_FACE_NAMES_EN[face]} a third ${clockwise ? 'clockwise' : 'counter-clockwise'}`,
  ftoTop: 'Top faces',
  ftoBottom: 'Bottom faces',
  ftoSlices: 'Slices',
  masterSliceTitle: (corner: RainbowCorner, clockwise: boolean) =>
    `Turn the inner slice of ${DINO_CORNER_NAMES_EN[corner]} a third ${clockwise ? 'clockwise' : 'counter-clockwise'}`,
  masterSlices: 'Inner slices',
  dinoTop: 'Top',
  dinoBottom: 'Bottom',
  rainbowFront: 'Front',
  rainbowBack: 'Back',
  pyraTurnTitle: (vertex: PyraVertex, layer: PyraLayer | 'faces', clockwise: boolean) => {
    const corner = CORNER_NAMES_EN[vertex]
    const target = {
      corners: `the layer of the ${corner}`,
      tips: `the tip of the ${corner}`,
      slice1: `the 1st slice of the ${corner}`,
      slice2: `the 2nd slice of the ${corner}`,
      slice3: `the 3rd slice of the ${corner}`,
      slice4: `the 4th slice of the ${corner}`,
      faces: `the face opposite the ${corner}`,
      deep: `the half of the ${corner}`,
    }[layer]
    return `Turn ${target} ${clockwise ? 'clockwise' : 'counterclockwise'}`
  },
  pyraKinds: {
    corners: 'Layers',
    tips: 'Tips',
    slice1: 'Slice 1',
    slice2: 'Slice 2',
    slice3: 'Slice 3',
    slice4: 'Slice 4',
    faces: 'Faces',
    deep: 'Corners',
  },
  noSuchLayer: (faceName: string, kind: LayerKind) =>
    `No ${kind === 'wide' || kind === 'wide3' ? 'wide turn' : 'inner slice'} for the ${faceName} on this puzzle`,
  jammedTurn: (faceName: string) => `Jammed: the ${faceName} cannot turn in this position`,
  layerLabel: 'Turned layer',
  vtoLayerKinds: { wide: 'Corners', outer: 'Tips' },
  layerGroups: { outer: 'Outer', inner: 'Inner' },
  layerKinds: {
    outer: 'Outer',
    slice: 'Slice',
    slice3: 'Slice 3',
    wide: 'Wide',
    wide3: 'Wide 3',
    advanced: 'Advanced',
  },
  editCube: 'Enter',
  editHintJoints:
    'Its joints first: a click on a blue joint fuses two pieces, into a 2x1 then a 2x2; a click on a fused piece takes it apart. Make your puzzle’s blocks (turn the view to reach the other faces), then accept the form.',
  acceptJoints: 'Accept the joints',
  changeJoints: 'Change the joints',
  piecesLeft: (n: number) => `${n} left`,
  piecesLeftLabel: (kind: string, n: number) => `${kind} pieces to fuse: ${n}`,
  errorJoints: 'These joints make no form of this puzzle: check each block.',
  errorJointsColors:
    'The colors do not go with the joints: a fused piece is not next to its block’s neighbor.',
  editCubeTitle: 'Enter a cube: paint its colors',
  editTitle: 'Cube input',
  editHint:
    'Pick a color, then click stickers. Orbit the view to reach the other faces. Pieces auto-complete and no impossible combination is accepted.',
  editHintGearPlain:
    'First bring your Gear Cube back into a cube, its gears aligned (turn a face until its slice is back in place). Then pick a color and click the pieces: corners and gears, the clips are black. Rotate the view to reach the other faces.',
  editHintGear:
    'First bring your Gear Cube back into a cube, its gears aligned (turn a face until its slice is back in place). Then pick a color and click the pieces: clips and gears are painted apart. Rotate the view to reach the other faces.',
  editHintQuarter:
    'Pick a color and click the stickers; the centers are there already. A click on a center turns its mark a quarter: give each the position of yours (it says which way its face can turn).',
  editHintCamo:
    'First put your Camouflage back into its brick shape, every piece lying flat, before entering it. Deformed, it can take hundreds of thousands of shapes: far too many to offer you, and no way to guess yours. Once in shape, pick a color and click the stickers; turn the view to reach the other faces.',
  editHintTwist:
    'Click a corner or an edge to put a piece there that fits: each click moves on to the next (another piece, or the same one turned). A click on a side center turns it a quarter turn, to match the shape of yours.',
  editHintMirror:
    'Pick a thickness, then click faces: the piece takes its shape as you go. Orbit the view to reach the other faces. Pieces auto-complete and no impossible combination is accepted.',
  palette: 'Colors',
  paletteMirror: 'Thicknesses',
  thickness: (rank: number) => `Thickness ${rank}`,
  filledOf: (n: number, total: number) => `${n} / ${total} stickers`,
  editHintPieces:
    'Click a slot to put a piece that fits there: each click moves on to the next one (another piece, or the same one flipped). Orbit the view to see the back. A piece already placed elsewhere is not offered.',
  piecesOf: (n: number, total: number) => `${n} / ${total} pieces`,
  facesOf: (n: number, total: number) => `${n} / ${total} faces`,
  clearAll: 'Clear all',
  editHintRoadblock:
    'Its centers are bars of three: a click paints the whole bar. First say which way each face’s bars go: at START, the four sides’ are level, the top’s and the bottom’s go from left to right; pick below a face turned a quarter. Then pick a color and click the stickers; turn the view to reach the other faces.',
  barsTurnedLabel: 'Bars turned a quarter',
  barsTurnedTitle: (face: string) =>
    `The bars of the ${face} go the other way than at START (its centers turn a quarter)`,
  barFaces: { U: 'Up', D: 'Down', L: 'Left', R: 'Right', F: 'Front', B: 'Back' },
  fromCurrent: 'Edit',
  fromCurrentTitle: 'Edit the cube from its current state',
  gearsNotAligned: 'Bring the cube back into shape first: it is entered with its gears aligned',
  notInBox:
    'Bring the puzzle back into its brick shape first: deformed, its shapes are too many to offer',
  chooseForm: 'What shape is your puzzle in?',
  chooseFormHint:
    'Pick the shape it stands in, held as in the thumbnail (hover one to see it large), before placing its colors.',
  formSortHint: 'They are grouped by how many small cubes stick out alone.',
  formGroup: (tips: number) =>
    tips === 0 ? 'No cube sticking out' : `${tips} cube${tips > 1 ? 's' : ''} sticking out`,
  formTile: (n: number, tips: number) =>
    `Shape ${n}${n === 1 ? ' (original)' : `, ${tips} cube${tips > 1 ? 's' : ''} sticking out`}`,
  changeForm: 'Change shape',
  saveState: 'Save',
  saveStateTitle: 'Save this state to come back to it (replaces the previous one)',
  savedAlready: 'This state is already saved',
  restoreState: 'Restore',
  restoreStateTitle: (time: string) => `Go back to the state saved at ${time}`,
  nothingSaved: 'No saved state for this cube',
  replaceSavedTitle: 'Replace the saved state?',
  replaceSavedMessage: (puzzle: string, time: string) =>
    `The ${puzzle} state saved at ${time} will be replaced by the current position, for good.`,
  replaceSaved: 'Replace',
  applyCube: 'Use this cube',
  cancel: 'Cancel',
  errorCounts: 'Inconsistent color counts.',
  errorCountsMirror: 'Inconsistent thickness counts.',
  errorGears: 'A gear does not carry its clips’ two colors.',
  errorImpossible: 'Impossible cube: check the piece orientations.',
  errorImpossibleAt: (step: string) =>
    `Impossible cube: solving gets stuck at the step “${step}”. Check those pieces.`,
  colors: {
    W: 'White',
    Y: 'Yellow',
    G: 'Green',
    B: 'Blue',
    O: 'Orange',
    R: 'Red',
    P: 'Pink',
    V: 'Violet',
    E: 'Dark green',
    N: 'Dark blue',
    T: 'Turquoise',
    K: 'Pale pink',
    M: 'Brown',
    L: 'Lime',
    C: 'Gold',
    H: 'Graphite',
  },
  cubeLabel: 'Cube choice',
  chooseModel: 'Choose a model',
  homeLink: 'Back to the home page',
  solveHint: 'Choose a model to see its solving methods.',
  solveKeys: {
    solve: 'Enter',
    pause: 'Space',
    stepBack: 'Page Up',
    stepAhead: 'Page Down',
    moveBack: '←',
    moveAhead: '→',
  },
  homeTitle: { before: 'Choose your model in the gallery, among the', after: 'available' },
  homeFeatures: {
    edit: {
      title: 'Input',
      text: 'Use the face input to copy the state of your physical cube.',
    },
    guide: {
      title: 'Guide',
      text: 'Use the guide to learn how to handle it and get familiar with its moves.',
    },
    solve: {
      title: 'Solving',
      text: 'Use the available solving methods to learn to solve it yourself, or watch the algorithm solve it for you.',
    },
  },
  chooseCube: 'Choose a cube',
  allCategories: 'All categories',
  /** The picker's way back to its categories. */
  categories: 'Categories',
  close: 'Close',
  moveGuide: 'Move guide',
  moveGuideIntro:
    'Each move is shown on the cube as it is now. Scroll: the ones in the middle play.',
  guideSections: {
    faces: 'Faces',
    middle: 'Middle slices',
    slices: 'Inner slices',
    wide: 'Wide turns',
    rings: 'Layers',
    slash: 'Slash',
    corners: 'Layers (tip + center + edges)',
    tips: 'Tips alone',
    slice1: 'First slices (co-tip + wings)',
    slice2: 'Second slices',
    slice3: 'Third slices',
    slice4: 'Fourth slices',
    deep: 'Corners (each its half of the puzzle)',
    sides: 'Sides (half turns)',
    edges: 'Edges (half turns)',
    gears: 'Faces (half turns, the slice follows a quarter)',
    gearsThrice: 'Three in a row (the cube is back in shape)',
    triangles: 'Triangles (the center stays put)',
    dinoCorners: 'Corners',
  },
  describeMove: describeEn,
  guideBlocked: 'This move is not possible in this configuration',
  puzzleCount: (n: number) => `${n} puzzle${n > 1 ? 's' : ''}`,
  cubeKind: (label: string, mirror: boolean) => `${label}${mirror ? ' mirror' : ''}`,
  cubeCategories: {
    standard: 'Standards',
    mirror: 'Mirrors',
    tower: 'Towers',
    flat: 'Flats',
    pyramid: 'Pyramids',
    polyhedron: 'Polyhedra',
    round: 'Cylinders',
    gear: 'Gears',
    diagonal: 'Diagonal cuts',
    holey: 'Holey',
    twisted: 'Twisted',
    bandaged: 'Bandaged',
  },
  sectionSetup: 'Setup',
  sectionSolve: 'Solve',
  collapse: 'Collapse menu',
  expand: 'Expand menu',
  showMore: 'Read more',
  showLess: 'Show less',
  methodLabel: 'Solving method',
  stepsLabel: 'Steps',
  ifNeeded: 'if needed',
  pauseTitle: 'Stop solving after the move under way',
  prevStep: 'Previous step',
  nextStep: 'Next step',
  undoStep: 'Undo the step',
  finishStep: 'Finish the step',
  prevMove: 'Previous move',
  nextMove: 'Next move',
}
