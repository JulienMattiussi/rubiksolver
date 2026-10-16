/** The tutorial's texts (the source; English mirrors it). */
export const TUTORIAL_FR = {
  button: 'Tutoriel',
  buttonTitle: 'Apprendre à résoudre pas à pas, en choisissant les pièces à déplacer',
  exit: 'Quitter le tutoriel',
  apply: 'Appliquer la formule',
  undo: 'Annuler le déplacement',
  finish: 'Valider le déplacement',
  next: 'Suivant',
  facing: (color: string) => `Place le centre ${color} face à toi.`,
  facingTitle: 'Tourner la vue pour l’avoir face à toi',
  /** A piece named by its kind (its stickers' count) and colors. */
  piece: (stickers: number, colors: string) =>
    stickers === 1
      ? `le centre ${colors}`
      : stickers === 2
        ? `l’arête ${colors}`
        : `le coin ${colors}`,
  spot: (piece: string) => `Repère ${piece} : la flèche montre sa place.`,
  spotSwap: (piece: string, other: string) => `Repère ${piece}, et ${other} qui occupe sa place.`,
  play: (count: number) =>
    count === 1 ? 'Effectue ce mouvement :' : `Effectue ces ${count} mouvements :`,
  check: (piece: string) =>
    `Vérifie les nouvelles positions : ${piece} est à sa place. Les pièces hachurées ont bougé aussi, on les placera plus tard.`,
  checkAll: 'Vérifie les nouvelles positions : les pièces sont à leur place.',
  /** The legend of the hatched pieces, under the step's hint. */
  legendMoved:
    'Les cubes hachurés seront modifiés par le mouvement, sans impact sur le résultat attendu.',
  noFormula: 'Aucune formule ne mène là sans déranger les pièces déjà placées.',
  solved: 'Résolu, bravo !',
  /** A step's rank among the method's stages, or before them. */
  stage: (n: number) => `Étape ${n}`,
  beforeStages: 'Avant de commencer',
  /** How far a step has come, by its key (its pieces placed, of how many). */
  progress: {
    stepTutorialCross: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} en place`,
  } as Record<string, (done: number, total: number) => string>,
  /** Each step's goal, by its key: the panel's heading. */
  titles: {
    stepRecenter: 'Remettre les centres en place',
    stepTutorialCross: 'Construire la croix jaune',
    stepBottomCorners: 'Placer les coins de la première couche',
  } as Record<string, string>,
  /** What each step asks, by its key. */
  hints: {
    stepRecenter:
      'Une tranche du milieu a déplacé les centres : on les remet d’abord en place, ils servent de repère à tout le reste.',
    stepTutorialCross: 'Place une à une les quatre arêtes jaunes du cube.',
    stepBottomCorners:
      'La croix est faite ! La suite, les coins de la première couche, arrive bientôt.',
  } as Record<string, string>,
}
