// French is the source of truth; English must provide every key (enforced by
// the `Translations` type below). Values are content, not code.

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
  faceNames: {
    U: 'face du haut',
    D: 'face du bas',
    L: 'face de gauche',
    R: 'face de droite',
    F: 'face avant',
    B: 'face arrière',
  },
  moveTitle: (faceName: string, clockwise: boolean, kind: 'outer' | 'slice' | 'wide' = 'outer') => {
    const target =
      kind === 'slice'
        ? `la tranche interne de la ${faceName}`
        : kind === 'wide'
          ? `les deux couches de la ${faceName}`
          : `la ${faceName}`
    return `Tourner ${target} dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`
  },
  layerLabel: 'Couche tournée',
  layerKinds: { outer: 'Externe', slice: 'Tranche', wide: 'Large' },
  editCube: 'Saisir un cube',
  editTitle: 'Saisie du cube',
  editHint:
    'Choisissez une couleur puis cliquez les stickers. Tournez la vue pour atteindre les autres faces. Les pièces se complètent toutes seules et aucune combinaison impossible n’est acceptée.',
  palette: 'Couleurs',
  filledOf: (n: number, total: number) => `${n} / ${total} stickers`,
  clearAll: 'Tout effacer',
  fromCurrent: 'Depuis l’état actuel',
  applyCube: 'Utiliser ce cube',
  cancel: 'Annuler',
  errorCounts: 'Répartition des couleurs incohérente.',
  errorImpossible: 'Cube impossible : vérifiez l’orientation des pièces.',
  colors: { W: 'Blanc', Y: 'Jaune', G: 'Vert', B: 'Bleu', O: 'Orange', R: 'Rouge' },
  sizeLabel: 'Choix du cube',
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
    reduction: {
      name: 'Réduction par couches',
      desc: 'Centres, appariement des arêtes, puis résolution par couches comme un 3x3.',
    },
    reductionCfop: {
      name: 'Réduction CFOP',
      desc: 'Centres, appariement des arêtes, puis Croix, F2L, OLL et PLL comme un 3x3.',
    },
    optimal: {
      name: 'Optimale',
      desc: 'Recherche exhaustive de la solution la plus courte possible (11 rotations maximum, 2x2 uniquement).',
    },
  },
  stepsLabel: 'Étapes',
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
  faceNames: {
    U: 'top face',
    D: 'bottom face',
    L: 'left face',
    R: 'right face',
    F: 'front face',
    B: 'back face',
  },
  moveTitle: (faceName: string, clockwise: boolean, kind: 'outer' | 'slice' | 'wide' = 'outer') => {
    const target =
      kind === 'slice'
        ? `the inner slice of the ${faceName}`
        : kind === 'wide'
          ? `both layers of the ${faceName}`
          : `the ${faceName}`
    return `Turn ${target} ${clockwise ? 'clockwise' : 'counter-clockwise'}`
  },
  layerLabel: 'Turned layer',
  layerKinds: { outer: 'Outer', slice: 'Slice', wide: 'Wide' },
  editCube: 'Enter a cube',
  editTitle: 'Cube input',
  editHint:
    'Pick a color, then click stickers. Orbit the view to reach the other faces. Pieces auto-complete and no impossible combination is accepted.',
  palette: 'Colors',
  filledOf: (n: number, total: number) => `${n} / ${total} stickers`,
  clearAll: 'Clear all',
  fromCurrent: 'From current state',
  applyCube: 'Use this cube',
  cancel: 'Cancel',
  errorCounts: 'Inconsistent color counts.',
  errorImpossible: 'Impossible cube: check the piece orientations.',
  colors: { W: 'White', Y: 'Yellow', G: 'Green', B: 'Blue', O: 'Orange', R: 'Red' },
  sizeLabel: 'Cube choice',
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
    reduction: {
      name: 'Reduction (layer by layer)',
      desc: 'Centers, edge pairing, then a layer-by-layer finish like a 3x3.',
    },
    reductionCfop: {
      name: 'Reduction (CFOP)',
      desc: 'Centers, edge pairing, then Cross, F2L, OLL and PLL like a 3x3.',
    },
    optimal: {
      name: 'Optimal',
      desc: 'Exhaustive search for the shortest possible solution (at most 11 turns, 2x2 only).',
    },
  },
  stepsLabel: 'Steps',
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
  },
}

export const LOCALES = { fr, en }
export type Locale = keyof typeof LOCALES
