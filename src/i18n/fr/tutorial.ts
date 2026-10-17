/** The tutorial's texts (the source; English mirrors it). */
export const TUTORIAL_FR = {
  button: 'Tutoriel',
  buttonTitle: 'Apprendre à résoudre pas à pas, en choisissant les pièces à déplacer',
  exit: 'Quitter le tutoriel',
  apply: 'Appliquer la formule',
  undo: 'Annuler le déplacement',
  finish: 'Valider le déplacement',
  next: 'Suivant',
  /** Why the actions replacing the cube are off. */
  locked: 'Indisponible pendant le tutoriel : quitte-le d’abord',
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
  /** None left: turns by hand have done the step's formula. */
  play: (count: number) =>
    count === 0
      ? 'Effectue les mouvements.'
      : count === 1
        ? 'Effectue ce mouvement :'
        : `Effectue ces ${count} mouvements :`,
  /** A block the formula repeats: after its lead, or the whole of it. */
  repeat: (times: number) => `Puis répète ${times} fois ces mouvements :`,
  repeatAll: (count: number, times: number) =>
    `Effectue ces ${count} mouvements, ${times} fois de suite :`,
  check: (piece: string) => `Vérifie les nouvelles positions : ${piece} est à sa place.`,
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
    stepTutorialCorner: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
  } as Record<string, (done: number, total: number) => string>,
  /** Each step's goal, by its key: the panel's heading. */
  titles: {
    stepRecenter: 'Remettre les centres en place',
    stepTutorialCross: 'Construire la croix jaune',
    stepTutorialCorner: 'Placer les coins jaunes',
    stepMiddle: 'Placer les arêtes de la deuxième couronne',
  } as Record<string, string>,
  /** What each step asks, by its key. */
  hints: {
    stepRecenter:
      'Une tranche du milieu a déplacé les centres : on les remet d’abord en place, ils servent de repère à tout le reste.',
    stepTutorialCross: 'Place une à une les quatre arêtes jaunes du cube.',
    stepTutorialCorner: 'Place un à un les quatre coins jaunes, jaune vers le bas.',
    stepMiddle:
      'La première couche est faite ! La suite, les arêtes de la deuxième couronne, arrive bientôt.',
  } as Record<string, string>,
}
