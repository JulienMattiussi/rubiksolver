import type { LayerKind } from '@/lib/core/moves'
import type { PyraLayer } from '@/lib/puzzles/pyramid/pyraminx'
import type { GhostSide, MegaFace, PyraVertex, RainbowCorner } from '@/lib/core/types'
import type { CubeVariant } from '@/lib/core/shapes'
import {
  CORNER_NAMES_EN,
  describeEn,
  describeShortEn,
  FACE_NAMES_EN,
  MEGA_FACE_NAMES_EN,
  SIDE_NAMES_EN,
  DINO_CORNER_NAMES_EN,
  FTO_FACE_NAMES_EN,
  TRIANGLE_NAMES_EN,
  STAR_LAYER_EN,
} from './moveSentences'
import type { StarLayer } from '../fr/moveSentences'
import type { UI_FR } from '../fr/ui'

/** A line's first letter, capitalized. */
const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

export const UI_EN: typeof UI_FR = {
  title: 'Rubik Solver',
  pageTitle: 'Rubik Solver: learn to solve the Rubik’s Cube and dozens of twisty puzzles',
  metaDescription:
    'Dozens of interactive 3D twisty puzzles, from the Rubik’s Cube to the Megaminx: turn, scramble or enter your own, then learn to solve it step by step.',
  madeWith: { before: 'Made with', love: 'love', by: 'by' },
  moves: 'Turns',
  scramble: 'Scramble',
  solve: 'Solve',
  computing: 'Computing the solution…',
  computingShort: 'Computing…',
  reset: 'Reset',
  stop: 'Stop',
  speed: 'Speed',
  speedHint: (value: number, unit: 'ms' | 's') =>
    `${value.toLocaleString('en-US')} ${unit} per move`,
  statusSolved: 'Solved',
  statusReady: 'Ready',
  statusPlaying: 'Animating',
  statusSolving: 'Solving',
  withTutorial: 'Tutorial available',
  withTutorials: 'Puzzles with a tutorial',
  solutionCount: (n: number) => `${n} turn${n > 1 ? 's' : ''}`,
  heldAs: (down: string, front: string) => [
    `${cap(down)} center down`,
    `${cap(front)} center in front`,
  ],
  heldAsMirror: (down: string, front: string) => [
    `${cap(down)} face down`,
    `${cap(front)} face in front`,
  ],
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
    return `Turn ${target} ${clockwise ? 'clockwise' : 'counterclockwise'}`
  },
  moveTitleHalf: (faceName: string) => `Turn the ${faceName} a half turn`,
  starTurnTitle: (layer: StarLayer, clockwise: boolean) =>
    `Turn the ${STAR_LAYER_EN[layer]} layer one piece ${clockwise ? 'clockwise' : 'counterclockwise'}`,
  slashTitle: 'Slash: flip the right half',
  gearTurnTitle: (faceName: string, clockwise: boolean) =>
    `Half turn of the ${faceName} ${clockwise ? 'clockwise' : 'counterclockwise'} (the slice follows a quarter)`,
  megaTurnTitle: (face: MegaFace, clockwise: boolean) =>
    `Turn ${MEGA_FACE_NAMES_EN[face]} a fifth ${clockwise ? 'clockwise' : 'counterclockwise'}`,
  megaUpper: 'Upper half',
  megaLower: 'Lower half',
  ghostTurnTitle: (side: GhostSide) => `Flip ${SIDE_NAMES_EN[side]} over (half turn)`,
  puckTurnTitle: (layer: 'U' | 'D', clockwise: boolean) =>
    `Turn the ${layer === 'U' ? 'top' : 'bottom'} disc one notch ${clockwise ? 'clockwise' : 'counterclockwise'}`,
  puckSlashTitle: 'Pivot: flip the right half over',
  rainbowTurnTitle: (triangle: RainbowCorner, clockwise: boolean) =>
    `Turn ${TRIANGLE_NAMES_EN[triangle]} a third ${clockwise ? 'clockwise' : 'counterclockwise'}`,
  dinoTurnTitle: (corner: RainbowCorner, clockwise: boolean) =>
    `Turn ${DINO_CORNER_NAMES_EN[corner]} a third ${clockwise ? 'clockwise' : 'counterclockwise'}`,
  ftoTurnTitle: (face: RainbowCorner, clockwise: boolean, slice: boolean) =>
    `Turn ${slice ? `the slice of ${FTO_FACE_NAMES_EN[face]}` : FTO_FACE_NAMES_EN[face]} a third ${clockwise ? 'clockwise' : 'counterclockwise'}`,
  ftoTop: 'Top faces',
  ftoBottom: 'Bottom faces',
  ftoSlices: 'Slices',
  masterSliceTitle: (corner: RainbowCorner, clockwise: boolean) =>
    `Turn the inner slice of ${DINO_CORNER_NAMES_EN[corner]} a third ${clockwise ? 'clockwise' : 'counterclockwise'}`,
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
    middle: 'Middle slice',
    wide: 'Wide',
    wide3: 'Wide 3',
    advanced: 'Advanced',
  },
  editCube: 'Enter',
  editHintCuts:
    'First place the halves as they stand: click a cell to cycle through their positions (lying, standing one way or the other, or a whole equator edge, four in all). Accept, then paint the colors.',
  fashionGroups: { blocks: 'Blocks', thin: 'Thin layers' },
  acceptCuts: 'Accept the halves',
  changeCuts: 'Change the halves',
  wholeEdgesOf: (n: number) => `${n} / 4 whole edges`,
  errorCuts: 'The halves cannot be placed like this: check each cell (four whole edges).',
  editHintJoints:
    'Its joints first: a click on a blue joint fuses two pieces, into a 2x1 then a 2x2; a click on a fused piece takes it apart. Make your puzzle’s blocks (turn the view to reach the other faces), then accept the shape.',
  acceptJoints: 'Accept the joints',
  changeJoints: 'Change the joints',
  piecesLeft: (n: number) => `${n} left`,
  piecesLeftLabel: (kind: string, n: number) => `${kind} pieces to fuse: ${n}`,
  errorJoints: 'These joints make no shape of this puzzle: check each block.',
  errorJointsColors:
    'The colors do not go with the joints: a fused piece is not next to its block’s neighbor.',
  editCubeTitle: 'Enter a cube: paint its colors',
  editTitle: 'Cube input',
  editHint:
    'Pick a color, then click stickers. Turn the view to reach the other faces. Pieces auto-complete and no impossible combination is accepted.',
  editHintGearPlain:
    'Pick a color and click the pieces: corners and gears, the clips are black. Turn the view to reach the other faces.',
  editHintGear:
    'Pick a color and click the pieces: clips and gears are painted apart. Turn the view to reach the other faces.',
  editHintGears:
    'The gears first: a click on a gear pivots it a sixth of a turn (with its whole slice, but on the Extreme). Give each the position of yours, then accept.',
  acceptGears: 'Accept the gears',
  changeGears: 'Change the gears',
  editHintQuarter:
    'Pick a color and click the stickers; the centers are there already. A click on a center turns its mark a quarter: give each the position of yours (it says which way its face can turn).',
  editHintCamo:
    'Pick a color and click the stickers; turn the view to reach the other faces. Your Camouflage is not a brick? “Change the shape” enters it face by face.',
  editHintFaces:
    'Copy the face of your puzzle toward you: pick a color (or “Absent” where no sticker shows) and click the cells, then click the joints between the cells of one sticker. Then tilt your puzzle toward you (its top comes to the front) and do the same.',
  faceStep: (n: number, total: number) => `Face ${n} / ${total}`,
  faceAbsent: 'Absent',
  tiltDown: 'Enter the next face',
  tiltUp: 'Back to the previous face',
  findShape: 'Find the shape',
  findingShape: 'Finding the shape…',
  changeFaces: 'Change the shape',
  errorFaces: 'This face is not complete: every cell must be painted, a color or “Absent”.',
  errorFacesShape:
    'No Camouflage shape shows these four faces: check the joints and the absent cells.',
  editHintTwist:
    'Click a corner or an edge to put a piece there that fits: each click moves on to the next (another piece, or the same one turned). A click on a side center turns it a quarter turn, to match the shape of yours.',
  editHintMirror:
    'Pick a thickness, then click faces: the piece takes its shape as you go. Turn the view to reach the other faces. Pieces auto-complete and no impossible combination is accepted.',
  palette: 'Colors',
  paletteMirror: 'Thicknesses',
  thickness: (rank: number) => `Thickness ${rank}`,
  filledOf: (n: number, total: number) => `${n} / ${total} stickers`,
  editHintPieces:
    'Click a slot to put a piece that fits there: each click moves on to the next one (another piece, or the same one flipped). Turn the view to see the back. A piece already placed elsewhere is not offered.',
  piecesOf: (n: number, total: number) => `${n} / ${total} pieces`,
  facesOf: (n: number, total: number) => `${n} / ${total} faces`,
  clearAll: 'Clear all',
  scanStart: 'Use the camera',
  scanUntried: 'This feature has not been tested and validated on this model yet',
  scanCheck: 'Scan done: check carefully that the model shown matches your puzzle, then apply.',
  scanUnseen: {
    sideCenters:
      'The camera cannot see which way the side centers lie: check each one, a click on a center turns it.',
  },
  scanTake: 'Scan the face',
  scanTakeHint: 'Place the puzzle in the frame, then tap the button to scan the face.',
  scanFirstCentered: (front: string, up: string) =>
    `Hold the camera still in front of the puzzle, the ${front} center **facing the lens** and ${up} **on top**, the center of the face **in the marked cell**, in a well-lit place.`,
  scanTakeHintSized:
    'Place the center of the face in the frame, then tap the button to scan the face.',
  scanHolding: 'Hold the puzzle still…',
  scanNothing: 'Nothing held still in the frame: place the puzzle again and retry.',
  scanMoves: {
    first: (front: string, up: string) =>
      `Hold the camera still in front of the puzzle, the ${front} center **facing the lens** and ${up} **on top**, the face filling the frame, in a well-lit place.`,
    turn: (front: string, up: string) =>
      `Turn the cube a quarter turn **to the left**: the ${front} center **facing the lens**, ${up} **still on top**.`,
    tilt: (front: string, up: string) =>
      `Tilt the top of the cube **toward the lens**: the ${front} center **facing the lens**, ${up} **on top**.`,
    flip: (front: string, up: string) =>
      `Turn the cube **half round**: the ${front} center **facing the lens**, ${up} **still on top**.`,
    below: (front: string, up: string) =>
      `Turn the puzzle **to the left**: the ${front} center **facing the lens**, ${up} **still at the bottom**.`,
    show: (front: string, up: string) =>
      `Show the ${front} center **to the lens**, ${up} **on top**.`,
    // The camera facing you (a laptop's): your left is its right.
    turnMirrored: (front: string, up: string) =>
      `Turn the cube a quarter turn **to the right**: the ${front} center **facing the lens**, ${up} **still on top**.`,
    belowMirrored: (front: string, up: string) =>
      `Turn the puzzle **to the right**: the ${front} center **facing the lens**, ${up} **still at the bottom**.`,
    // A polyhedron's flat faces are never told by their colors: as below.
    spin: () =>
      'Turn the pyramid a third of a turn **to the left**, its top point **staying on top**.',
    spinMirrored: () =>
      'Turn the pyramid a third of a turn **to the right**, its top point **staying on top**.',
    upend: () =>
      'Turn the puzzle **upside down**, half round toward the lens: its bottom point comes **on top**.',
    topple: () =>
      'Show the bottom: tip the top point **backward**, the bottom face comes **to face the lens**.',
    // A puzzle out of shape names no color (`told` never): as below.
    // A puzzle read whole names no color either.
    anchored: () =>
      'Hold the camera still in front of a large face of the puzzle, its middle piece **in the marked shape**, in a well-lit place.',
    upright: () =>
      'Hold the camera still in front of the puzzle, its longest side **upright**, its middle small cubes **in the outlined cells**.',
  },
  // A mirror's faces, named by their thickness (its centers all alike).
  scanMovesSized: {
    first: (front: string, up: string) =>
      `Hold the camera still in front of the cube, the ${front} face **toward the lens** and the ${up} face **on top**, the center of the face **in the frame**, in a well-lit place. A face shows by its center: the deeper it sits, the thinner the face.`,
    turn: (front: string, up: string) =>
      `Turn the cube a quarter turn **to the left**: the ${front} face **toward the lens**, the ${up} face **still on top**.`,
    turnMirrored: (front: string, up: string) =>
      `Turn the cube a quarter turn **to the right**: the ${front} face **toward the lens**, the ${up} face **still on top**.`,
    tilt: (front: string, up: string) =>
      `Tilt the top of the cube **toward the lens**: the ${front} face **toward the lens**, the ${up} face **on top**.`,
    flip: (front: string, up: string) =>
      `Give the cube a **half turn**: the ${front} face **toward the lens**, the ${up} face **still on top**.`,
    show: (front: string, up: string) =>
      `Show the ${front} face **to the lens**, the ${up} face **on top**, the center of the face **in the frame**.`,
  },
  scanMovesAny: {
    first:
      'Hold the camera still in front of the puzzle, any face shaped like the frame **facing the lens** and filling it, in a well-lit place.',
    turn: 'Turn the puzzle **to the left** up to the next face, its top **staying on top**.',
    below:
      'Turn the puzzle **to the left** up to the next face, its bottom **staying at the bottom**.',
    turnMirrored:
      'Turn the puzzle **to the right** up to the next face, its top **staying on top**.',
    belowMirrored:
      'Turn the puzzle **to the right** up to the next face, its bottom **staying at the bottom**.',
    tilt: 'Show the top: tilt the top of the puzzle **toward the lens**, the top face comes **to face the lens**.',
    flip: 'Turn the puzzle **half round**: the face at the back comes **to face the lens**.',
    show: 'Show the next face **to the lens**.',
    spin: 'Turn the pyramid a third of a turn **to the left**, its top point **staying on top**.',
    spinMirrored:
      'Turn the pyramid a third of a turn **to the right**, its top point **staying on top**.',
    upend:
      'Turn the puzzle **upside down**, half round toward the lens: its bottom point comes **on top**.',
    topple:
      'Show the bottom: tip the top point **backward**, the bottom face comes **to face the lens**.',
    anchored:
      'Hold the camera still in front of a large face of the puzzle, its middle piece **in the marked shape**, in a well-lit place.',
    upright:
      'Hold the camera still in front of the puzzle, its longest side **upright**, its middle small cubes **in the outlined cells**.',
  },
  scanAgain: 'The face to take again, as it was taken',
  scanMissed: 'Puzzle not detected properly: take this face again, held as in the picture.',
  scanChecking: 'Checking the face…',
  scanReading: 'Reading the puzzle…',
  scanDenied: 'The camera could not be opened: allow it in the browser settings, then try again.',
  torchOn: 'Turn the light on',
  torchOff: 'Turn the light off',
  editHintRoadblock:
    'Its centers are bars of three: a click paints the whole bar. Pick a color and click the stickers; turn the view to reach the other faces.',
  editHintBars:
    'Which way the bars go first: at START, the four sides’ are level, the top’s and the bottom’s go from left to right. A click on a center turns its face’s bars a quarter. Give each face the way of yours, then accept.',
  acceptBars: 'Accept the bars',
  changeBars: 'Change the bars',
  fromCurrent: 'Edit',
  fromCurrentTitle: 'Edit the cube from its current state',
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
  cubeLabelOf: (name: string) => `Cube choice: ${name}`,
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
  describeMoveShort: describeShortEn,
  guideBlocked: 'This move is not possible in this configuration',
  puzzleCount: (n: number) => `${n} puzzle${n > 1 ? 's' : ''}`,
  cubeKind: (label: string, variant: CubeVariant) =>
    `${label}${({ classic: '', mirror: ' mirror' } as const)[variant]}`,
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
