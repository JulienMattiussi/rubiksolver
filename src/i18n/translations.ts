// French is the source of truth; English must provide every key (enforced by
// the `Translations` type below). Values are content, not code.

import type { LayerKind } from '@/lib/moves'
import type { MoveDescription } from '@/lib/moveGuide'
import type { Face, RingMove } from '@/lib/types'

type StarLayer = RingMove['ring']

const STAR_LAYER_FR: Record<StarLayer, string> = {
  U: 'l’étage du haut',
  u: 'l’étage interne du haut',
  d: 'l’étage interne du bas',
  D: 'l’étage du bas',
}

const STAR_LAYER_EN: Record<StarLayer, string> = {
  U: 'top',
  u: 'inner top',
  d: 'inner bottom',
  D: 'bottom',
}

/** The top layers turn clockwise seen from above, the others from below. */
const fromAbove = (ring: StarLayer): boolean => ring === 'U' || ring === 'u'

const FACE_NAMES_FR: Record<Face, string> = {
  U: 'face du haut',
  D: 'face du bas',
  L: 'face de gauche',
  R: 'face de droite',
  F: 'face avant',
  B: 'face arrière',
}

/** The half of the puzzle on a face's side (a wide turn on four layers). */
const HALF_NAMES_FR: Record<Face, string> = {
  U: 'la moitié du haut',
  D: 'la moitié du bas',
  L: 'la moitié gauche',
  R: 'la moitié droite',
  F: 'la moitié avant',
  B: 'la moitié arrière',
}

const HALF_NAMES_EN: Record<Face, string> = {
  U: 'the top half',
  D: 'the bottom half',
  L: 'the left half',
  R: 'the right half',
  F: 'the front half',
  B: 'the back half',
}

const FACE_NAMES_EN: Record<Face, string> = {
  U: 'top face',
  D: 'bottom face',
  L: 'left face',
  R: 'right face',
  F: 'front face',
  B: 'back face',
}

/** The move guide's sentence for a turn. */
function describeFr(d: MoveDescription): string {
  if (d.kind === 'slash') {
    return 'Le slash : toute la moitié droite fait un demi-tour, ses pièces du haut passent en bas et celles du bas en haut.'
  }
  if (d.kind === 'ring') {
    const layer = STAR_LAYER_FR[d.ring]
    if (d.pieces === 3) {
      return `On tourne ${layer} de trois crans, soit un demi-tour : le sens n’a pas d’importance.`
    }
    const notches = d.pieces === 1 ? 'd’un cran' : 'de deux crans'
    const sense = d.clockwise ? 'des aiguilles' : 'inverse des aiguilles'
    const seen = fromAbove(d.ring) ? 'vu de dessus' : 'vu de dessous'
    return `On tourne ${layer} ${notches} (${60 * d.pieces}°) dans le sens ${sense} d’une montre, ${seen}.`
  }
  const face = FACE_NAMES_FR[d.face]
  const target = {
    face: `la ${face}`,
    middle: `la tranche du milieu, parallèle à la ${face},`,
    slice: `la tranche interne voisine de la ${face}`,
    wide: d.halfPuzzle
      ? `toute ${HALF_NAMES_FR[d.face]} du puzzle`
      : `la ${face} et la tranche interne voisine ensemble`,
  }[d.kind]
  const how =
    d.turn === 'half'
      ? 'd’un demi-tour : le sens n’a pas d’importance'
      : `d’un quart de tour dans le sens ${d.turn === 'cw' ? 'des aiguilles' : 'inverse des aiguilles'} d’une montre, vu depuis la ${face}`
  return `On tourne ${target} ${how}.`
}

function describeEn(d: MoveDescription): string {
  if (d.kind === 'slash') {
    return 'The slash: the whole right half makes a half turn, its top pieces going down and its bottom ones up.'
  }
  if (d.kind === 'ring') {
    const layer = `the ${STAR_LAYER_EN[d.ring]} layer`
    if (d.pieces === 3) {
      return `Turn ${layer} three notches, a half turn: the direction does not matter.`
    }
    const notches = d.pieces === 1 ? 'one notch' : 'two notches'
    const sense = d.clockwise ? 'clockwise' : 'counterclockwise'
    const seen = fromAbove(d.ring) ? 'as seen from above' : 'as seen from below'
    return `Turn ${layer} ${notches} (${60 * d.pieces}°) ${sense}, ${seen}.`
  }
  const face = FACE_NAMES_EN[d.face]
  const target = {
    face: `the ${face}`,
    middle: `the middle slice, parallel to the ${face},`,
    slice: `the inner slice next to the ${face}`,
    wide: d.halfPuzzle
      ? `${HALF_NAMES_EN[d.face]} of the puzzle`
      : `the ${face} and the inner slice next to it together`,
  }[d.kind]
  const how =
    d.turn === 'half'
      ? 'a half turn: the direction does not matter'
      : `a quarter turn ${d.turn === 'cw' ? 'clockwise' : 'counterclockwise'}, as seen from the ${face}`
  return `Turn ${target} ${how}.`
}

const fr = {
  title: 'Rubik Solver',
  moves: 'Rotations',
  scramble: 'Mélanger',
  solve: 'Résoudre',
  reset: 'Réinitialiser',
  stop: 'Arrêter',
  speed: 'Vitesse',
  statusSolved: 'Cube résolu',
  statusReady: 'Prêt',
  statusPlaying: 'Animation en cours',
  statusSolving: 'Résolution',
  solutionCount: (n: number) => `${n} rotation${n > 1 ? 's' : ''}`,
  language: 'Langue',
  notation: 'Notation',
  recenter: 'Recentrer la vue',
  notationTitles: {
    us: 'Notation internationale (U D L R F B)',
    fr: 'Notation française (H B G D F Ar)',
  },
  faceNames: FACE_NAMES_FR,
  moveTitle: (faceName: string, clockwise: boolean, kind: LayerKind = 'outer') => {
    const target =
      kind === 'slice'
        ? `la tranche interne de la ${faceName}`
        : kind === 'wide'
          ? `les deux couches de la ${faceName}`
          : `la ${faceName}`
    return `Tourner ${target} dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`
  },
  moveTitleHalf: (faceName: string) => `Retourner la ${faceName} (demi-tour)`,
  starTurnTitle: (layer: StarLayer, clockwise: boolean) =>
    `Tourner ${STAR_LAYER_FR[layer]} d’une pièce dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`,
  slashTitle: 'Slash : retourner la moitié droite',
  noSuchLayer: (faceName: string, kind: LayerKind) =>
    `Pas de ${kind === 'wide' ? 'coup large' : 'tranche interne'} pour la ${faceName} sur ce puzzle`,
  jammedTurn: (faceName: string) =>
    `Bloqué : la tour n’a pas de couche complète sur la ${faceName} dans cette position`,
  layerLabel: 'Couche tournée',
  layerKinds: { outer: 'Externe', slice: 'Tranche', wide: 'Large', advanced: 'Avancé' },
  editCube: 'Saisir un cube',
  editTitle: 'Saisie du cube',
  editHint:
    'Choisissez une couleur puis cliquez les stickers. Tournez la vue pour atteindre les autres faces. Les pièces se complètent toutes seules et aucune combinaison impossible n’est acceptée.',
  editHintMirror:
    'Choisissez une épaisseur puis cliquez les faces : la pièce prend sa forme au fur et à mesure. Tournez la vue pour atteindre les autres faces. Les pièces se complètent toutes seules et aucune combinaison impossible n’est acceptée.',
  palette: 'Couleurs',
  paletteMirror: 'Épaisseurs',
  thickness: (rank: number) => `Épaisseur ${rank}`,
  filledOf: (n: number, total: number) => `${n} / ${total} stickers`,
  clearAll: 'Tout effacer',
  fromCurrent: 'Depuis l’état actuel',
  fromCurrentUnboxed: 'Remettez d’abord la tour en forme',
  saveState: 'Mémoriser',
  saveStateTitle: 'Mémoriser cet état pour y revenir (remplace le précédent)',
  savedAlready: 'Cet état est déjà mémorisé',
  restoreState: 'Restaurer',
  restoreStateTitle: (time: string) => `Revenir à l’état mémorisé à ${time}`,
  nothingSaved: 'Aucun état mémorisé pour ce cube',
  replaceSavedTitle: 'Remplacer l’état mémorisé ?',
  replaceSavedMessage: (time: string) =>
    `L’état mémorisé à ${time} sera remplacé par la position actuelle, sans retour possible.`,
  replaceSaved: 'Remplacer',
  applyCube: 'Utiliser ce cube',
  cancel: 'Annuler',
  errorCounts: 'Répartition des couleurs incohérente.',
  errorCountsMirror: 'Répartition des épaisseurs incohérente.',
  errorImpossible: 'Cube impossible : vérifiez l’orientation des pièces.',
  colors: {
    W: 'Blanc',
    Y: 'Jaune',
    G: 'Vert',
    B: 'Bleu',
    O: 'Orange',
    R: 'Rouge',
    P: 'Rose',
    V: 'Violet',
  },
  cubeLabel: 'Choix du cube',
  chooseCube: 'Choisir un cube',
  allCategories: 'Toutes les catégories',
  close: 'Fermer',
  moveGuide: 'Guide des mouvements',
  moveGuideIntro:
    'Chaque mouvement est montré sur le cube dans son état actuel. Faites défiler : ceux du centre s’animent.',
  guideSections: {
    faces: 'Faces',
    middle: 'Tranches du milieu',
    slices: 'Tranches internes',
    wide: 'Coups larges',
    rings: 'Étages',
    slash: 'Slash',
  },
  describeMove: describeFr,
  guideBlocked: 'Ce mouvement n’est pas possible dans cette configuration',
  puzzleCount: (n: number) => `${n} puzzle${n > 1 ? 's' : ''}`,
  cubeKind: (label: string, mirror: boolean) => `${label}${mirror ? ' miroir' : ''}`,
  cubeCategories: {
    standard: 'Standard',
    mirror: 'Miroir',
    tower: 'Tower',
    flat: 'Plats',
    star: 'Étoiles',
  },
  sectionSetup: 'Initialisation',
  sectionSolve: 'Résolution',
  collapse: 'Replier le menu',
  expand: 'Déplier le menu',
  methodLabel: 'Méthode de résolution',
  methods: {
    beginner: {
      name: 'Par couches',
      desc: 'Étage par étage : 1re couche entière, couche du milieu (sur 3x3), puis dernière couche.',
    },
    cfop: {
      name: 'Fridrich (CFOP)',
      desc: 'Croix, puis paires F2L, puis orientation (OLL), puis permutation (PLL) de la dernière couche.',
    },
    roux: {
      name: 'Roux',
      desc: 'Deux blocs 1x2x3 (le second en R, U, M et r seulement), les coins du haut (CMLL), puis les six dernières arêtes en M et U.',
    },
    petrus: {
      name: 'Petrus',
      desc: 'Bloc 2x2x2, étendu en 2x2x3, orientation des arêtes, fin des deux couches en R et U seulement, puis la dernière couche.',
    },
    zz: {
      name: 'ZZ',
      desc: 'Toutes les arêtes orientées et la ligne du bas d’abord (EOLine), puis les deux blocs sans jamais tourner F ni B, puis OCLL et PLL.',
    },
    reduction: {
      name: 'Réduction par couches',
      desc: 'Centres, appariement des arêtes, puis résolution par couches comme un 3x3.',
    },
    reductionCfop: {
      name: 'Réduction CFOP',
      desc: 'Centres, appariement des arêtes, puis Croix, F2L, OLL et PLL comme un 3x3.',
    },
    twoPockets: {
      name: 'Deux Pockets',
      desc: 'La tour vue comme deux Pockets empilés : la remettre en forme en pivotant ses sommets, puis finir le Pocket intérieur, puis le Pocket extérieur, avec deux formules du Domino (descendre un sommet, permuter deux sommets).',
    },
    isolateFirst: {
      name: 'Isoler puis permuter',
      desc: 'Séparer les sommets verts (en haut) et bleus (en bas), puis finir le bas et le haut avec une seule formule, K, qui échange deux sommets de chaque étage.',
    },
    twoStars: {
      name: 'Deux étoiles',
      desc: 'Le 4-Star Prism est fait de deux 2-Star Prism : on résout l’étoile interne (h, b) puis l’externe (H, B), chacune comme un 2-Star, avec la même formule K.',
    },
    equatorFirst: {
      name: 'Équateur puis coins',
      desc: 'Comme un Domino debout : les quatre arêtes de l’équateur, puis les coins du bas descendus deux par deux, puis les coins du haut échangés deux à deux.',
    },
    cornersFirst: {
      name: 'Coins puis arêtes',
      desc: 'Les coins d’abord, puis les arêtes, chaque fois avec une formule qui ne touche que ce qui reste à faire (Domino : bas puis haut ; Floppy : les coins placés, puis les arêtes retournées deux par deux).',
    },
    optimal: {
      name: 'Optimale',
      desc: 'Recherche exhaustive de la solution la plus courte possible (2x2, 1x2x3 et Floppy, dont les espaces d’états sont assez petits).',
    },
  },
  stepsLabel: 'Étapes',
  allowedTurns: 'Coups autorisés :',
  stepByStep: 'Pas à pas',
  nextStep: 'Étape suivante',
  steps: {
    stepBottomCross: 'Croix du bas',
    stepBottomCorners: 'Coins de la 1re couche',
    stepMiddle: 'Arêtes du milieu',
    stepTopCross: 'Croix du haut',
    stepOrientCorners: 'Orienter les coins',
    stepPermuteCorners: 'Placer les coins',
    stepPermuteEdges: 'Placer les arêtes',
    stepCross: 'Croix',
    stepF2L: 'F2L (deux premières couches)',
    stepOLL: 'OLL (orienter la dernière face)',
    stepPLL: 'PLL (permuter la dernière couche)',
    stepOptimal: 'Solution optimale',
    stepCenters: 'Centres',
    stepPairEdges: 'Appariement des arêtes',
    stepParity: 'Correction de parité',
    stepFirstBlock: 'Premier bloc (1x2x3 à gauche)',
    stepSecondBlock: 'Second bloc (1x2x3 à droite)',
    stepCMLL: 'CMLL (coins du haut)',
    stepLSEOrient: 'Orienter les six arêtes',
    stepLSEUlUr: 'Placer UL et UR',
    stepLSEMiddle: 'Finir la tranche M',
    stepBlock222: 'Bloc 2x2x2',
    stepBlock223: 'Extension en 2x2x3',
    stepFixEdges: 'Orienter les arêtes',
    stepF2LRU: 'Finir les deux couches',
    stepEOLine: 'EOLine (arêtes orientées + ligne)',
    stepLeftBlock: 'Bloc de gauche',
    stepRightBlock: 'Bloc de droite',
    stepOCLL: 'OCLL (orienter les coins)',
    stepTowerShape: 'Remettre en forme (pivoter les sommets)',
    stepTopCorners: 'Coins du haut',
    stepBottomEdges: 'Arêtes du bas',
    stepTopEdges: 'Arêtes du haut',
    stepCorners: 'Placer les coins',
    stepEquator: 'Équateur',
    stepIsolate: 'Isoler les sommets',
    stepStarBottom: 'Finir le bas',
    stepStarTop: 'Finir le haut',
    stepRecenter: 'Remettre les centres',
    stepInnerIsolate: 'Étoile interne : isoler',
    stepInnerBottom: 'Étoile interne : finir b',
    stepInnerTop: 'Étoile interne : finir h',
    stepOuterIsolate: 'Étoile externe : isoler',
    stepOuterBottom: 'Étoile externe : finir le bas',
    stepOuterTop: 'Étoile externe : finir le haut',
    stepAlignStars: 'Aligner les deux étoiles',
    stepFlipEdges: 'Retourner les arêtes',
    stepInnerPocket: 'Pocket intérieur',
    stepOuterPocket: 'Pocket extérieur',
  },
}

export type Translations = typeof fr

const en: Translations = {
  title: 'Rubik Solver',
  moves: 'Turns',
  scramble: 'Scramble',
  solve: 'Solve',
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
        : kind === 'wide'
          ? `both layers of the ${faceName}`
          : `the ${faceName}`
    return `Turn ${target} ${clockwise ? 'clockwise' : 'counter-clockwise'}`
  },
  moveTitleHalf: (faceName: string) => `Turn the ${faceName} a half turn`,
  starTurnTitle: (layer: StarLayer, clockwise: boolean) =>
    `Turn the ${STAR_LAYER_EN[layer]} layer one piece ${clockwise ? 'clockwise' : 'counterclockwise'}`,
  slashTitle: 'Slash: flip the right half',
  noSuchLayer: (faceName: string, kind: LayerKind) =>
    `No ${kind === 'wide' ? 'wide turn' : 'inner slice'} for the ${faceName} on this puzzle`,
  jammedTurn: (faceName: string) =>
    `Jammed: the tower has no complete layer on the ${faceName} in this position`,
  layerLabel: 'Turned layer',
  layerKinds: { outer: 'Outer', slice: 'Slice', wide: 'Wide', advanced: 'Advanced' },
  editCube: 'Enter a cube',
  editTitle: 'Cube input',
  editHint:
    'Pick a color, then click stickers. Orbit the view to reach the other faces. Pieces auto-complete and no impossible combination is accepted.',
  editHintMirror:
    'Pick a thickness, then click faces: the piece takes its shape as you go. Orbit the view to reach the other faces. Pieces auto-complete and no impossible combination is accepted.',
  palette: 'Colors',
  paletteMirror: 'Thicknesses',
  thickness: (rank: number) => `Thickness ${rank}`,
  filledOf: (n: number, total: number) => `${n} / ${total} stickers`,
  clearAll: 'Clear all',
  fromCurrent: 'From current state',
  fromCurrentUnboxed: 'Put the tower back in shape first',
  saveState: 'Save',
  saveStateTitle: 'Save this state to come back to it (replaces the previous one)',
  savedAlready: 'This state is already saved',
  restoreState: 'Restore',
  restoreStateTitle: (time: string) => `Go back to the state saved at ${time}`,
  nothingSaved: 'No saved state for this cube',
  replaceSavedTitle: 'Replace the saved state?',
  replaceSavedMessage: (time: string) =>
    `The state saved at ${time} will be replaced by the current position, for good.`,
  replaceSaved: 'Replace',
  applyCube: 'Use this cube',
  cancel: 'Cancel',
  errorCounts: 'Inconsistent color counts.',
  errorCountsMirror: 'Inconsistent thickness counts.',
  errorImpossible: 'Impossible cube: check the piece orientations.',
  colors: {
    W: 'White',
    Y: 'Yellow',
    G: 'Green',
    B: 'Blue',
    O: 'Orange',
    R: 'Red',
    P: 'Pink',
    V: 'Violet',
  },
  cubeLabel: 'Cube choice',
  chooseCube: 'Choose a cube',
  allCategories: 'All categories',
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
  },
  describeMove: describeEn,
  guideBlocked: 'This move is not possible in this configuration',
  puzzleCount: (n: number) => `${n} puzzle${n > 1 ? 's' : ''}`,
  cubeKind: (label: string, mirror: boolean) => `${label}${mirror ? ' mirror' : ''}`,
  cubeCategories: {
    standard: 'Standard',
    mirror: 'Mirror',
    tower: 'Tower',
    flat: 'Flat',
    star: 'Stars',
  },
  sectionSetup: 'Setup',
  sectionSolve: 'Solve',
  collapse: 'Collapse menu',
  expand: 'Expand menu',
  methodLabel: 'Solving method',
  methods: {
    beginner: {
      name: 'Layer by layer',
      desc: 'Floor by floor: whole first layer, middle layer (on 3x3), then the last layer.',
    },
    cfop: {
      name: 'Fridrich (CFOP)',
      desc: 'Cross, then F2L pairs, then orient (OLL) and permute (PLL) the last layer.',
    },
    roux: {
      name: 'Roux',
      desc: 'Two 1x2x3 blocks (the second with R, U, M and r only), the top corners (CMLL), then the last six edges with M and U.',
    },
    petrus: {
      name: 'Petrus',
      desc: '2x2x2 block, extended to 2x2x3, edge orientation, first two layers finished with R and U only, then the last layer.',
    },
    zz: {
      name: 'ZZ',
      desc: 'Every edge oriented and the bottom line first (EOLine), then both blocks without ever turning F or B, then OCLL and PLL.',
    },
    reduction: {
      name: 'Reduction (layer by layer)',
      desc: 'Centers, edge pairing, then a layer-by-layer finish like a 3x3.',
    },
    reductionCfop: {
      name: 'Reduction (CFOP)',
      desc: 'Centers, edge pairing, then Cross, F2L, OLL and PLL like a 3x3.',
    },
    twoPockets: {
      name: 'Two Pockets',
      desc: 'The tower seen as two stacked Pockets: put it back in shape by pivoting its corners, then finish the inner Pocket, then the outer Pocket, with two Domino formulas (descend a corner, swap two corners).',
    },
    isolateFirst: {
      name: 'Isolate then permute',
      desc: 'Separate the green points (up) from the blue ones (down), then finish the bottom and the top with a single formula, K, which swaps two points of each layer.',
    },
    twoStars: {
      name: 'Two stars',
      desc: 'The 4-Star Prism is made of two 2-Star Prisms: solve the inner star (u, d), then the outer one (U, D), each like a 2-Star, with the same formula K.',
    },
    equatorFirst: {
      name: 'Equator then corners',
      desc: 'Like a Domino standing up: the four equator edges, then the bottom corners brought down two by two, then the top corners swapped two at a time.',
    },
    cornersFirst: {
      name: 'Corners then edges',
      desc: 'Corners first, then edges, each time with a formula that only touches what is left to do (Domino: bottom then top; Floppy: corners placed, then edges flipped two at a time).',
    },
    optimal: {
      name: 'Optimal',
      desc: 'Exhaustive search for the shortest possible solution (2x2, 1x2x3 and Floppy, whose state spaces are small enough).',
    },
  },
  stepsLabel: 'Steps',
  allowedTurns: 'Allowed turns:',
  stepByStep: 'Step by step',
  nextStep: 'Next step',
  steps: {
    stepBottomCross: 'Bottom cross',
    stepBottomCorners: 'First-layer corners',
    stepMiddle: 'Middle edges',
    stepTopCross: 'Top cross',
    stepOrientCorners: 'Orient corners',
    stepPermuteCorners: 'Place corners',
    stepPermuteEdges: 'Place edges',
    stepCross: 'Cross',
    stepF2L: 'F2L (first two layers)',
    stepOLL: 'OLL (orient last face)',
    stepPLL: 'PLL (permute last layer)',
    stepOptimal: 'Optimal solution',
    stepCenters: 'Centers',
    stepPairEdges: 'Edge pairing',
    stepParity: 'Parity fix',
    stepFirstBlock: 'First block (1x2x3 on the left)',
    stepSecondBlock: 'Second block (1x2x3 on the right)',
    stepCMLL: 'CMLL (top corners)',
    stepLSEOrient: 'Orient the six edges',
    stepLSEUlUr: 'Place UL and UR',
    stepLSEMiddle: 'Finish the M slice',
    stepBlock222: '2x2x2 block',
    stepBlock223: 'Extend to 2x2x3',
    stepFixEdges: 'Orient the edges',
    stepF2LRU: 'Finish the first two layers',
    stepEOLine: 'EOLine (oriented edges + line)',
    stepLeftBlock: 'Left block',
    stepRightBlock: 'Right block',
    stepOCLL: 'OCLL (orient corners)',
    stepTowerShape: 'Back in shape (pivot the corners)',
    stepTopCorners: 'Top corners',
    stepBottomEdges: 'Bottom edges',
    stepTopEdges: 'Top edges',
    stepCorners: 'Place the corners',
    stepEquator: 'Equator',
    stepIsolate: 'Isolate the points',
    stepStarBottom: 'Finish the bottom',
    stepStarTop: 'Finish the top',
    stepRecenter: 'Put the centers back',
    stepInnerIsolate: 'Inner star: isolate',
    stepInnerBottom: 'Inner star: finish d',
    stepInnerTop: 'Inner star: finish u',
    stepOuterIsolate: 'Outer star: isolate',
    stepOuterBottom: 'Outer star: finish the bottom',
    stepOuterTop: 'Outer star: finish the top',
    stepAlignStars: 'Align the two stars',
    stepFlipEdges: 'Flip the edges',
    stepInnerPocket: 'Inner Pocket',
    stepOuterPocket: 'Outer Pocket',
  },
}

export const LOCALES = { fr, en }
export type Locale = keyof typeof LOCALES
