import type { TutorialTexts } from '../../tutorialTexts'

/** The Skewb tutorial's texts (lib/tutorials/diagonal/), by key. */
export const SKEWB_FR: TutorialTexts = {
  holding: {
    skewb: (color: string) =>
      `Tourne le Skewb sans changer son haut, pour avoir devant toi le côté qui sera ${color}.`,
  },
  checks: {
    stepSkewbCenters: (done: number) =>
      done === 5
        ? 'Vérifie que chaque centre est maintenant sur sa face.'
        : 'Vérifie que le centre du bas et celui de devant ont changé de place, ceux de gauche et de droite aussi.',
    stepSkewbBottom: (done: number) =>
      done === 4
        ? 'Vérifie que chaque coin du bas est tourné : le Skewb est résolu.'
        : 'Vérifie que les quatre coins du bas ont tourné, rien d’autre n’ayant bougé.',
  },
  placed: {
    stepSkewbTopPlaced: (piece: string, before: number, up: string) =>
      before === 0
        ? `Vérifie que ${piece} est maintenant à côté du centre ${up}.`
        : `Vérifie que ${piece} est maintenant à côté du centre ${up}, ses couleurs de côté allant avec celles des coins du haut déjà placés.`,
  },
  figures: {
    figureSkewbCenters:
      'Repère les centres qui ne sont pas sur leur face : la formule échange le centre du bas avec celui de devant, et les centres de gauche et de droite entre eux.',
    figureSkewbBottom:
      'Repère les coins du bas mal tournés : la formule jouée deux fois les fait tourner tous les quatre, sans rien déranger d’autre.',
  },
  terms: {
    termSkewbCorner:
      'Un **coin** : une pièce à trois faces, à chaque sommet du cube. Il tourne d’un tiers de tour, toute la moitié du cube de son côté avec lui.',
    termSkewbCenter:
      'Un **centre** : le carré au milieu de chaque face. Il dit la couleur que prendra sa face, mais il bouge quand un coin tourne.',
    termSkewbClockwise:
      'Le **sens horaire** : c’est le sens des aiguilles d’une montre, en regardant le coin qui tourne, d’en face.',
    termSkewbCounterclockwise:
      'Le **sens anti-horaire** : c’est le sens inverse des aiguilles d’une montre, en regardant toujours le coin qui tourne.',
  },
  progress: {
    stepSkewbTopPlaced: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} placé${done > 1 ? 's' : ''} entre eux`,
    stepSkewbTopTwist: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} bien tourné${done > 1 ? 's' : ''}`,
    stepSkewbCenters: (done: number, total: number) =>
      `${done} centre${done > 1 ? 's' : ''} sur ${total} sur sa face`,
    stepSkewbBottom: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} bien tourné${done > 1 ? 's' : ''}`,
  },
  titles: {
    stepSkewbTopPlaced: 'Placer les coins du haut',
    stepSkewbTopTwist: 'Tourner les coins du haut',
    stepSkewbCenters: 'Placer les centres',
    stepSkewbBottom: 'Tourner les coins du bas',
  },
  hints: {
    stepSkewbTopPlaced:
      'Le centre du haut ne bougera plus. Place autour de lui les quatre coins qui ont sa couleur, en ne tournant que les coins du bas. Un coin est placé quand ses couleurs de côté vont avec celles des coins voisins, même s’il est mal tourné : les centres des côtés ne comptent pas encore, ils se placeront à l’étape 3.',
    stepSkewbTopTwist:
      'Tourne chaque coin du haut sur lui-même, tenu devant à droite, pour que la couleur du centre du haut soit dessus.',
    stepSkewbCenters:
      'Place chaque centre sur sa face, en échangeant le centre du bas avec celui de devant.',
    stepSkewbBottom:
      'Tourne les coins du bas sur eux-mêmes, quatre à la fois, depuis un côté puis un autre : le Skewb est alors résolu.',
  },
}
