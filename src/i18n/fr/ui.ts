import type { LayerKind } from '@/lib/core/moves'
import type { PyraLayer } from '@/lib/puzzles/pyramid/pyraminx'
import type { GhostSide, MegaFace, PyraVertex, RainbowCorner } from '@/lib/core/types'
import {
  CORNER_NAMES_FR,
  describeFr,
  FACE_NAMES_FR,
  MEGA_FACE_NAMES_FR,
  SIDE_NAMES_FR,
  DINO_CORNER_NAMES_FR,
  FTO_FACE_NAMES_FR,
  TRIANGLE_NAMES_FR,
  STAR_LAYER_FR,
  type StarLayer,
} from '../moveSentences'

/** The interface's texts and move titles (the source; English mirrors it). */
export const UI_FR = {
  title: 'Rubik Solver',
  madeWith: { before: 'Fait avec', love: 'amour', by: 'par' },
  moves: 'Rotations',
  scramble: 'Mélanger',
  solve: 'Résoudre',
  computing: 'Calcul de la solution…',
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
        : kind === 'slice3'
          ? `la troisième couche depuis la ${faceName}`
          : kind === 'wide'
            ? `les deux couches de la ${faceName}`
            : kind === 'wide3'
              ? `les trois couches de la ${faceName}`
              : `la ${faceName}`
    return `Tourner ${target} dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`
  },
  moveTitleHalf: (faceName: string) => `Retourner la ${faceName} (demi-tour)`,
  starTurnTitle: (layer: StarLayer, clockwise: boolean) =>
    `Tourner ${STAR_LAYER_FR[layer]} d’une pièce dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`,
  slashTitle: 'Slash : retourner la moitié droite',
  gearTurnTitle: (faceName: string, clockwise: boolean) =>
    `Demi-tour de la ${faceName} dans le sens ${clockwise ? 'horaire' : 'anti-horaire'} (la tranche suit d’un quart)`,
  megaTurnTitle: (face: MegaFace, clockwise: boolean) =>
    `Tourner ${MEGA_FACE_NAMES_FR[face]} d’un cinquième dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`,
  megaUpper: 'Moitié haute',
  megaLower: 'Moitié basse',
  ghostTurnTitle: (side: GhostSide) => `Retourner ${SIDE_NAMES_FR[side]} (demi-tour)`,
  puckTurnTitle: (layer: 'U' | 'D', clockwise: boolean) =>
    `Tourner le disque ${layer === 'U' ? 'du haut' : 'du bas'} d’un cran dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`,
  puckSlashTitle: 'Pivot : retourner la moitié droite',
  rainbowTurnTitle: (triangle: RainbowCorner, clockwise: boolean) =>
    `Tourner ${TRIANGLE_NAMES_FR[triangle]} d’un tiers dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`,
  dinoTurnTitle: (corner: RainbowCorner, clockwise: boolean) =>
    `Tourner ${DINO_CORNER_NAMES_FR[corner]} d’un tiers dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`,
  ftoTurnTitle: (face: RainbowCorner, clockwise: boolean, slice: boolean) =>
    `Tourner ${slice ? `la tranche de ${FTO_FACE_NAMES_FR[face]}` : FTO_FACE_NAMES_FR[face]} d’un tiers dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`,
  ftoTop: 'Faces du haut',
  ftoBottom: 'Faces du bas',
  ftoSlices: 'Tranches',
  masterSliceTitle: (corner: RainbowCorner, clockwise: boolean) =>
    `Tourner la tranche intérieure de ${DINO_CORNER_NAMES_FR[corner]} d’un tiers dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`,
  masterSlices: 'Tranches intérieures',
  dinoTop: 'Haut',
  dinoBottom: 'Bas',
  rainbowFront: 'Devant',
  rainbowBack: 'Derrière',
  pyraTurnTitle: (vertex: PyraVertex, layer: PyraLayer | 'faces', clockwise: boolean) => {
    const corner = CORNER_NAMES_FR[vertex]
    const target = {
      corners: `la couche du ${corner}`,
      tips: `la pointe du ${corner}`,
      slice1: `la 1re tranche du ${corner}`,
      slice2: `la 2e tranche du ${corner}`,
      slice3: `la 3e tranche du ${corner}`,
      slice4: `la 4e tranche du ${corner}`,
      faces: `la face opposée au ${corner}`,
      deep: `la moitié du ${corner}`,
    }[layer]
    return `Tourner ${target} dans le sens ${clockwise ? 'horaire' : 'anti-horaire'}`
  },
  pyraKinds: {
    corners: 'Couches',
    tips: 'Pointes',
    slice1: 'Tranche 1',
    slice2: 'Tranche 2',
    slice3: 'Tranche 3',
    slice4: 'Tranche 4',
    // A Master's or a Professor's last slice: the face opposite the corner.
    faces: 'Faces',
    deep: 'Sommets',
  },
  noSuchLayer: (faceName: string, kind: LayerKind) =>
    `Pas de ${kind === 'wide' || kind === 'wide3' ? 'coup large' : 'tranche interne'} pour la ${faceName} sur ce puzzle`,
  jammedTurn: (faceName: string) =>
    `Bloqué : la ${faceName} ne peut pas tourner dans cette position`,
  layerLabel: 'Couche tournée',
  vtoLayerKinds: { wide: 'Sommets', outer: 'Pointes' },
  layerGroups: { outer: 'Externes', inner: 'Internes' },
  layerKinds: {
    outer: 'Externe',
    slice: 'Tranche',
    slice3: 'Tranche 3',
    wide: 'Large',
    wide3: 'Large 3',
    advanced: 'Avancé',
  },
  editCube: 'Saisir',
  editHintJoints:
    'D’abord les soudures : un clic sur un joint bleu soude deux pièces, en 2x1 puis en 2x2 ; un clic sur une pièce soudée la défait. Formez les blocs de votre puzzle (tournez la vue pour atteindre les autres faces), puis validez la forme.',
  acceptJoints: 'Valider les soudures',
  changeJoints: 'Changer les soudures',
  piecesLeft: (n: number) => `${n} restante${n > 1 ? 's' : ''}`,
  piecesLeftLabel: (kind: string, n: number) => `Pièces ${kind} à souder : ${n}`,
  errorJoints: 'Ces soudures ne donnent aucune forme de ce puzzle : vérifiez chaque bloc.',
  errorJointsColors:
    'Les couleurs ne vont pas avec les soudures : une pièce soudée n’est pas à côté de sa voisine de bloc.',
  editCubeTitle: 'Saisir un cube : peindre ses couleurs',
  editTitle: 'Saisie du cube',
  editHint:
    'Choisissez une couleur puis cliquez les stickers. Tournez la vue pour atteindre les autres faces. Les pièces se complètent toutes seules et aucune combinaison impossible n’est acceptée.',
  editHintGearPlain:
    'Remettez d’abord votre Gear Cube en forme de cube, engrenages réalignés (tournez une face jusqu’à ce que sa tranche reprenne sa place). Puis choisissez une couleur et cliquez les pièces : coins et engrenages, les agrafes sont noires. Tournez la vue pour atteindre les autres faces.',
  editHintGear:
    'Remettez d’abord votre Gear Cube en forme de cube, engrenages réalignés (tournez une face jusqu’à ce que sa tranche reprenne sa place). Puis choisissez une couleur et cliquez les pièces : les agrafes et les engrenages se peignent à part. Tournez la vue pour atteindre les autres faces.',
  editHintQuarter:
    'Choisissez une couleur puis cliquez les stickers ; les centres sont déjà là. Un clic sur un centre tourne son repère d’un quart : donnez à chacun la position du vôtre (il dit dans quel sens sa face peut tourner).',
  editHintCamo:
    'Remettez d’abord votre Camouflage en forme de pavé, chaque pièce à plat, avant de le saisir. Déformé, il peut prendre des centaines de milliers de formes : bien trop pour vous les proposer, et pas moyen de deviner la vôtre. Une fois en forme, choisissez une couleur et cliquez les stickers ; tournez la vue pour atteindre les autres faces.',
  editHintTwist:
    'Cliquez un coin ou une arête pour y poser une pièce qui peut s’y loger : chaque clic passe à la suivante (autre pièce, ou la même tournée). Un clic sur un centre de côté le tourne d’un quart de tour, pour lui donner la forme du vôtre.',
  editHintMirror:
    'Choisissez une épaisseur puis cliquez les faces : la pièce prend sa forme au fur et à mesure. Tournez la vue pour atteindre les autres faces. Les pièces se complètent toutes seules et aucune combinaison impossible n’est acceptée.',
  palette: 'Couleurs',
  paletteMirror: 'Épaisseurs',
  thickness: (rank: number) => `Épaisseur ${rank}`,
  filledOf: (n: number, total: number) => `${n} / ${total} stickers`,
  editHintPieces:
    'Cliquez un emplacement pour y poser une pièce qui peut s’y loger : chaque clic passe à la suivante (autre pièce, ou la même retournée). Tournez la vue pour voir l’arrière. Une pièce déjà posée ailleurs n’est pas proposée.',
  piecesOf: (n: number, total: number) => `${n} / ${total} pièces`,
  facesOf: (n: number, total: number) => `${n} / ${total} faces`,
  clearAll: 'Tout effacer',
  editHintRoadblock:
    'Ses centres sont des barres de trois : un clic peint la barre entière. Dites d’abord dans quel sens vont les barres de chaque face : en position START, celles des quatre côtés sont horizontales, celles du haut et du bas vont de gauche à droite ; choisissez ci-dessous une face tournée d’un quart. Puis choisissez une couleur et cliquez les stickers ; tournez la vue pour atteindre les autres faces.',
  barsTurnedLabel: 'Barres tournées d’un quart',
  barsTurnedTitle: (face: string) =>
    `Les barres de la ${face} vont dans l’autre sens qu’en position START (ses centres tournent d’un quart)`,
  barFaces: { U: 'Haut', D: 'Bas', L: 'Gauche', R: 'Droite', F: 'Avant', B: 'Arrière' },
  fromCurrent: 'Modifier',
  fromCurrentTitle: 'Modifier le cube depuis son état actuel',
  gearsNotAligned: 'Remettez d’abord le cube en forme : la saisie se fait engrenages réalignés',
  notInBox:
    'Remettez d’abord le puzzle en forme de pavé : déformé, ses formes sont trop nombreuses pour être proposées',
  chooseForm: 'Dans quelle forme est votre puzzle ?',
  chooseFormHint:
    'Choisissez la forme dans laquelle il se trouve, tenu comme sur la vignette (survolez-en une pour la voir en grand), avant d’en placer les couleurs.',
  formSortHint: 'Elles sont rangées par nombre de petits cubes isolés aux pointes.',
  formGroup: (tips: number) =>
    tips === 0
      ? 'Sans cube isolé'
      : `${tips} cube${tips > 1 ? 's' : ''} isolé${tips > 1 ? 's' : ''}`,
  formTile: (n: number, tips: number) =>
    `Forme ${n}${n === 1 ? ' (d’origine)' : `, ${tips} cube${tips > 1 ? 's' : ''} isolé${tips > 1 ? 's' : ''}`}`,
  changeForm: 'Changer de forme',
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
  errorGears: 'Un engrenage ne porte pas les deux couleurs de ses agrafes.',
  errorImpossible: 'Cube impossible : vérifiez l’orientation des pièces.',
  errorImpossibleAt: (step: string) =>
    `Cube impossible : la résolution bloque à l’étape « ${step} ». Vérifiez ces pièces.`,
  colors: {
    W: 'Blanc',
    Y: 'Jaune',
    G: 'Vert',
    B: 'Bleu',
    O: 'Orange',
    R: 'Rouge',
    P: 'Rose',
    V: 'Violet',
    E: 'Vert foncé',
    N: 'Bleu foncé',
    T: 'Turquoise',
    K: 'Rose pâle',
    M: 'Marron',
    L: 'Vert citron',
    C: 'Doré',
    H: 'Graphite',
  },
  cubeLabel: 'Choix du cube',
  chooseCube: 'Choisir un cube',
  chooseModel: 'Choisissez un modèle',
  homeLink: 'Revenir à l’accueil',
  solveHint: 'Choisissez un modèle pour voir les choix de solution.',
  /** Keyboard shortcuts of the solve buttons, shown in their titles. */
  solveKeys: {
    solve: 'Entrée',
    pause: 'Espace',
    stepBack: 'Page précédente',
    stepAhead: 'Page suivante',
    moveBack: '←',
    moveAhead: '→',
  },
  // Around the number of models, shown apart (emphasized).
  homeTitle: { before: 'Choisissez votre modèle dans la galerie, parmi les', after: 'disponibles' },
  homeFeatures: {
    edit: {
      title: 'Saisie',
      text: 'Utilisez la saisie des faces pour reproduire l’état de votre cube physique.',
    },
    guide: {
      title: 'Guide',
      text: 'Utilisez le guide pour apprendre à le manipuler et vous familiariser avec ses mouvements.',
    },
    solve: {
      title: 'Résolution',
      text: 'Utilisez les méthodes de résolution disponibles pour apprendre à le résoudre par vous-même, ou voir l’algorithme le résoudre pour vous.',
    },
  },
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
    corners: 'Couches (sommet + centre + arêtes)',
    tips: 'Pointes seules',
    slice1: 'Premières tranches (co-sommet + ailes)',
    slice2: 'Deuxièmes tranches',
    slice3: 'Troisièmes tranches',
    slice4: 'Quatrièmes tranches',
    deep: 'Sommets (chacun sa moitié du puzzle)',
    sides: 'Côtés (demi-tours)',
    gears: 'Faces (demi-tours, la tranche suit d’un quart)',
    gearsThrice: 'Trois de suite (le cube reprend sa forme)',
    triangles: 'Triangles (le centre ne bouge pas)',
    dinoCorners: 'Sommets',
  },
  describeMove: describeFr,
  guideBlocked: 'Ce mouvement n’est pas possible dans cette configuration',
  puzzleCount: (n: number) => `${n} puzzle${n > 1 ? 's' : ''}`,
  cubeKind: (label: string, mirror: boolean) => `${label}${mirror ? ' miroir' : ''}`,
  cubeCategories: {
    standard: 'Standards',
    mirror: 'Miroirs',
    tower: 'Tours',
    flat: 'Plats',
    pyramid: 'Pyramides',
    polyhedron: 'Polyèdres',
    round: 'Cylindriques',
    gear: 'Engrenages',
    diagonal: 'Coupes diagonales',
    holey: 'Troués',
    twisted: 'Torturés',
    bandaged: 'Soudés',
  },
  sectionSetup: 'Initialisation',
  sectionSolve: 'Résolution',
  collapse: 'Replier le menu',
  expand: 'Déplier le menu',
  showMore: 'Lire la suite',
  showLess: 'Réduire',
  methodLabel: 'Méthode de résolution',
  stepsLabel: 'Étapes',
  ifNeeded: 'si nécessaire',
  pauseTitle: 'Arrêter la résolution après le mouvement en cours',
  prevStep: 'Étape précédente',
  nextStep: 'Étape suivante',
  undoStep: 'Défaire l’étape',
  finishStep: 'Finir l’étape',
  prevMove: 'Coup précédent',
  nextMove: 'Coup suivant',
}
