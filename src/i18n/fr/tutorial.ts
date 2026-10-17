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
  spot: (piece: string) => `Repère ${piece}.`,
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
  /** The round of a repeated block under way, followed by hand. */
  round: (n: number, times: number) => `(${n === 1 ? '1re' : `${n}e`} fois sur ${times})`,
  /** Moves after a sequence, one by one. */
  thenPlay: (count: number) =>
    count === 1 ? 'Puis effectue ce mouvement :' : `Puis effectue ces ${count} mouvements :`,
  /** A sequence learnt in the formula: after other moves, or first. */
  thenSequence: 'Puis effectue cet enchaînement :',
  sequence: (count: number) => `Effectue cet enchaînement de ${count} mouvements :`,
  repeatAll: (count: number, times: number) =>
    `Effectue ces ${count} mouvements, ${times} fois de suite :`,
  check: (piece: string) => `Vérifie les nouvelles positions : ${piece} est à sa place.`,
  checkAll: 'Vérifie les nouvelles positions : les pièces sont à leur place.',
  checkFigure: 'Vérifie la nouvelle figure que dessine le blanc en haut.',
  /** The figures the top's white draws, by their key. */
  figures: {
    figureDot: 'Repère le blanc du haut : un point au centre, aucune arête blanche dessus.',
    figureL: 'Repère le blanc du haut : un L, tenu derrière et à gauche.',
    figureLine: 'Repère le blanc du haut : une ligne, tenue de gauche à droite.',
  } as Record<string, string>,
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
    stepTutorialMiddle: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialTopCross: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} blanche${done > 1 ? 's' : ''} sur ${total} vers le haut`,
  } as Record<string, (done: number, total: number) => string>,
  /** Each step's goal, by its key: the panel's heading. */
  titles: {
    stepRecenter: 'Remettre les centres en place',
    stepTutorialCross: 'Construire la croix jaune',
    stepTutorialCorner: 'Placer les coins jaunes',
    stepTutorialMiddle: 'Placer les arêtes du milieu',
    stepTutorialTopCross: 'Construire la croix blanche',
    stepTopEdges: 'Placer les arêtes blanches',
  } as Record<string, string>,
  /** What each step asks, by its key. */
  hints: {
    stepRecenter:
      'Une tranche du milieu a déplacé les centres : on les remet d’abord en place, ils servent de repère à tout le reste.',
    stepTutorialCross: 'Place une à une les quatre arêtes jaunes du cube.',
    stepTutorialCorner: 'Place un à un les quatre coins jaunes, jaune vers le bas.',
    stepTutorialMiddle:
      'Place une à une les quatre arêtes de la deuxième couronne, celles sans jaune ni blanc.',
    stepTutorialTopCross:
      'Tourne les arêtes du haut pour que le blanc y dessine une croix, sans t’occuper encore de leurs côtés.',
    stepTopEdges:
      'La croix blanche est faite ! La suite, les arêtes du haut à leur place, arrive bientôt.',
  } as Record<string, string>,
}
