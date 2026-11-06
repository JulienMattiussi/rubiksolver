import type { TutorialTexts } from '../../tutorialTexts'

/** The flat puzzles' tutorials' texts (lib/tutorials/flat/: the Floppy's
 *  and the 1x2x3's), by key. */
export const FLAT_FR: TutorialTexts = {
  holding: {
    ghost: (piece: string) => `Tiens le Floppy Ghost à plat face à toi, ${piece} en haut à gauche.`,
  },
  checks: {
    stepTutorialFloppyCross: (done: number) =>
      done === 4
        ? 'Vérifie que chaque face montre une croix de la couleur de son centre.'
        : 'Vérifie que l’arête s’est retournée : sa face du bas a la couleur du centre du bas.',
    stepTutorialFloppyCycle: (done: number) =>
      done === 4
        ? 'Vérifie que chaque coin est entre les côtés de ses couleurs : le Floppy est résolu.'
        : 'Vérifie que le coin est arrivé à sa place, les arêtes et les coins déjà placés intacts.',
    stepTutorialFloppyEdges: (done: number) =>
      done === 4
        ? 'Vérifie que les quatre arêtes montrent leur couleur sur chaque face : le Floppy est résolu.'
        : 'Vérifie que deux arêtes se sont retournées, les coins restés en place.',
    stepTutorialFlatEdge: () =>
      'Vérifie que l’arête du bas s’est retournée, les coins restés en place.',
  },
  figures: {
    figureFloppyPair:
      'Deux arêtes côte à côte sont à l’envers : tiens-les devant et à droite, la formule les retourne toutes les deux.',
    figureFloppyOpposite:
      'Deux arêtes opposées sont à l’envers : tiens-en une devant. La formule la retourne avec celle de droite, ce qui laisse deux arêtes côte à côte.',
    figureFloppyFour:
      'Les quatre arêtes sont à l’envers : la formule en retourne deux, il en reste deux côte à côte.',
    figureFlatEdge:
      'L’arête du bas montre la couleur de derrière : la formule la retourne seule, les coins reviennent à leur place.',
  },
  terms: {
    termFlatCorner:
      'Un **coin** : une pièce au bout d’une rangée, avec deux côtés visibles en plus des deux grandes faces.',
    termFlatEdge:
      'Une **arête** : une pièce au milieu d’un bord. Elle ne quitte jamais sa place : un demi-tour la retourne seulement.',
    termGhostCorner:
      'Un **coin** : une pièce entre deux branches de l’étoile, sur un bord du carré. Il y en a cinq, de A à E.',
    termGhostEdge:
      'Une **arête** : une branche de l’étoile. Elle ne quitte jamais sa place : un coup la retourne seulement. Il y en a cinq, de 1 à 5.',
    termGhostTurn:
      'Un **coup** retourne tout un côté d’un demi-tour : son arête se retourne sur place, ses deux coins s’échangent en se retournant.',
    termHalfTurn:
      'Un **demi-tour** : la seule façon de tourner un côté. Le côté se retourne, il change de face.',
  },
  progress: {
    stepTutorialFloppyCross: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} à l’endroit`,
    stepTutorialFloppyCycle: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialGhostCorners: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialGhostTwist: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} à l’endroit`,
    stepTutorialGhostEdges: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} à l’endroit`,
    stepTutorialFloppyCorners: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialFlatCorners: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialFloppyEdges: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} à l’endroit`,
    stepTutorialFlatEdge: (done: number) =>
      done ? 'Arête du bas à l’endroit' : 'Arête du bas à retourner',
  },
  titles: {
    stepTutorialFloppyCross: 'Faire la croix',
    stepTutorialFloppyCycle: 'Placer les coins',
    stepTutorialGhostCorners: 'Placer les coins',
    stepTutorialGhostTwist: 'Retourner les coins',
    stepTutorialGhostEdges: 'Retourner les arêtes',
    stepTutorialFloppyCorners: 'Placer les coins',
    stepTutorialFlatCorners: 'Placer les coins',
    stepTutorialFloppyEdges: 'Retourner les arêtes',
    stepTutorialFlatEdge: 'Retourner l’arête du bas',
  },
  hints: {
    stepTutorialFloppyCross:
      'Les arêtes ne quittent jamais leur place : un demi-tour de leur côté les retourne seulement. Retourne une à une celles qui sont à l’envers, pour faire sur chaque face une croix de la couleur de son centre.',
    stepTutorialFloppyCycle:
      'La croix faite, une formule de quatre demi-tours fait tourner trois coins sans toucher aux arêtes. Tiens la place du coin à droite devant toi : selon où il se trouve, l’une des formules l’y amène. Place ainsi un coin, puis tourne le Floppy d’un côté pour le suivant : une fois deux coins placés, les deux derniers le sont aussi.',
    stepTutorialGhostCorners:
      'Ramène un à un les coins à leur place, à l’endroit ou à l’envers : par un coup, ou par une formule de quatre coups qui fait tourner trois coins en rond, jouée depuis le côté qu’il faut.',
    stepTutorialGhostTwist:
      'Les coins sont en place ; ceux à l’envers se retournent deux par deux, côte à côte, par une formule de huit coups (elle retourne aussi deux arêtes, vues ensuite).',
    stepTutorialGhostEdges:
      'Il reste les arêtes à l’envers : une formule de six coups en retourne deux côte à côte sans rien toucher d’autre.',
    stepTutorialFloppyCorners:
      'Les arêtes ne quittent jamais leur place : elles disent la couleur de chaque côté. Ramène un à un les coins entre les côtés de leurs couleurs, en quelques demi-tours qui gardent les coins déjà placés.',
    stepTutorialFlatCorners:
      'L’arête du haut ne quitte jamais sa rangée : elle dit comment tenir le puzzle, le blanc en haut, sa couleur de devant face à toi. Ramène un à un les coins à leur place, en quelques demi-tours qui gardent ceux déjà placés ; le dernier s’y met tout seul.',
    stepTutorialFloppyEdges:
      'Les coins sont faits, mais des arêtes peuvent être à l’envers. Une formule de six demi-tours les retourne deux par deux sans rien toucher d’autre.',
    stepTutorialFlatEdge:
      'Les coins sont faits ; il reste peut-être l’arête du bas à l’envers. Une formule de six demi-tours la retourne seule.',
  },
}
