import type { TutorialTexts } from '../../tutorialTexts'

/** The 3x3 tutorial's texts (lib/tutorials/standard/cube3.ts), by key. */
export const CUBE3_FR: TutorialTexts = {
  checks: {
    stepHoldCube: () => 'Vérifie que tu tiens le cube comme indiqué.',
    // The white center counted with the edges.
    stepTutorialTopCross: (done: number) =>
      `Vérifie qu’il y a maintenant ${done + 1} faces blanches vers le haut.`,
    stepTutorialTopEdges: (done: number) =>
      done === 1
        ? 'Vérifie qu’une arête blanche est maintenant en face de son centre.'
        : `Vérifie que ${done} arêtes blanches sont maintenant en face de leur centre.`,
    stepTutorialTopCorners: (done: number) =>
      done === 1
        ? 'Vérifie qu’un coin blanc est maintenant à sa place.'
        : `Vérifie que ${done} coins blancs sont maintenant à leur place.`,
    stepTutorialTopTwist: () => 'Vérifie que chaque coin a son blanc en haut : le cube est résolu.',
  },
  figures: {
    figureDot: 'Repère le blanc du haut : un point au centre, aucune arête blanche dessus.',
    figureL: 'Repère le blanc du haut : un L, tenu derrière et à gauche.',
    figureLine: 'Repère le blanc du haut : une ligne, tenue de gauche à droite.',
    figureEdgesTurn:
      'Repère les arêtes blanches : un tour du haut suffit à les mettre toutes en face de leur centre.',
    figureEdgesSide: 'Repère les deux arêtes blanches en face de leur centre, côte à côte.',
    figureEdgesFacing:
      'Repère les arêtes blanches en face de leur centre : deux face à face, ou aucune.',
    figureCornersOne:
      'Repère le coin blanc déjà à sa place, même mal tourné : il reste devant à droite.',
    figureCornersNone: 'Aucun coin blanc n’est encore à sa place : la formule en placera un.',
    figureCornersTwist:
      'Repère les coins blancs dont le blanc n’est pas en haut : chacun passe devant à droite pour être tourné.',
  },
  progress: {
    stepTutorialCross: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialCorner: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialMiddle: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialTopCross: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} blanche${done > 1 ? 's' : ''} sur ${total} vers le haut`,
    stepTutorialTopEdges: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} à sa place`,
    stepTutorialTopCorners: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} à sa place`,
    stepTutorialTopTwist: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} blanc en haut`,
  },
  titles: {
    stepHoldCube: 'Tenir le cube',
    stepTutorialCross: 'Construire la croix jaune',
    stepTutorialCorner: 'Placer les coins jaunes',
    stepTutorialMiddle: 'Placer les arêtes du milieu',
    stepTutorialTopCross: 'Construire la croix blanche',
    stepTutorialTopEdges: 'Placer les arêtes blanches',
    stepTutorialTopCorners: 'Placer les coins blancs',
    stepTutorialTopTwist: 'Tourner les coins blancs',
  },
  hints: {
    stepHoldCube:
      'Les centres ne sont pas là où le tutoriel les attend : tourne le cube dans tes mains pour les y remettre, sans tourner aucune face.',
    stepTutorialCross: 'Place une à une les quatre arêtes jaunes du cube.',
    stepTutorialCorner: 'Place un à un les quatre coins jaunes, jaune vers le bas.',
    stepTutorialMiddle:
      'Place une à une les quatre arêtes de la deuxième couronne, celles sans jaune ni blanc.',
    stepTutorialTopCross:
      'Tourne les arêtes du haut pour que toutes leurs faces blanches soient vers le haut.',
    stepTutorialTopEdges: 'Place chaque arête blanche au-dessus du centre de sa couleur.',
    stepTutorialTopCorners:
      'Place chaque coin blanc entre ses trois centres, même s’il est mal tourné.',
    stepTutorialTopTwist:
      'Tourne chaque coin blanc pour que son blanc soit en haut. La première couche se défait en route : continue, elle se refait à la fin.',
  },
}
