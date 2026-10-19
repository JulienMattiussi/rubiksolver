import type { CubeColor } from '@/lib/core/types'
import { listFr } from './list'
import { PIECES_FR } from './tutorial'

/**
 * The tutorial's texts on a mirror cube, where a color is a thickness: each
 * names a side by how thick it is, and replaces the text it stands for (the
 * texts with no color in them stay as they are).
 */
export const TUTORIAL_MIRROR_FR = {
  /** Each color's thickness, from the thinnest. */
  thickness: {
    O: 'très fine',
    Y: 'fine',
    B: 'moins fine',
    G: 'moins épaisse',
    W: 'épaisse',
    R: 'très épaisse',
  } as Record<CubeColor, string>,
  piece: (kind: string, names: readonly string[]) =>
    kind === 'center'
      ? `le centre de la face ${names[0]}`
      : `${PIECES_FR[kind] ?? 'la pièce'} aux faces ${listFr(names)}`,
  /** The words that change on a mirror cube, and a thickness's (the first
   *  telling what thicknesses are). */
  terms: {
    termCenter:
      'Un **centre** : la pièce au milieu d’une face, ils ont une seule face visible. Les centres ne changent pas de place : chacun donne l’épaisseur de sa face.',
    termCenter4:
      'Un **centre** : une des quatre pièces au milieu d’une face, ils ont une seule face visible.',
    termWing:
      'Une **arête** : une pièce à deux faces, sur un bord. Chaque couple d’épaisseurs en a deux.',
    termEdge4:
      'Une **paire** : les deux arêtes de mêmes épaisseurs, côte à côte et dans le même sens.',
  } as Record<string, string>,
  thicknessTerm: (name: string, first: boolean) =>
    `${first ? 'Sur un cube miroir, toutes les faces ont la même couleur : on les reconnaît à leur épaisseur, de très fine à très épaisse. ' : ''}En bleu, les pièces qui ont une face **${name}**.`,
  /** A side to hold in front, center or not. */
  facing: (name: string, down: string) =>
    `Tourne vers toi la face ${name}, la face ${down} en bas.`,
  checkFigure: 'Vérifie la nouvelle figure que dessinent les faces épaisses en haut.',
  checks: {
    stepTutorialTopCross: (done: number) =>
      `Vérifie qu’il y a maintenant ${done + 1} faces épaisses vers le haut.`,
    stepTutorialTopEdges: (done: number) =>
      done === 1
        ? 'Vérifie qu’une arête du haut est maintenant alignée avec son centre.'
        : `Vérifie que ${done} arêtes du haut sont maintenant alignées avec leur centre.`,
    stepTutorialTopCorners: (done: number) =>
      done === 1
        ? 'Vérifie qu’un coin du haut est maintenant à sa place.'
        : `Vérifie que ${done} coins du haut sont maintenant à leur place.`,
    stepTutorialTopTwist: () =>
      'Vérifie que chaque coin a sa face épaisse en haut : le cube est résolu.',
    stepTutorialFace2: () => 'Vérifie qu’un coin de plus a maintenant sa face fine en haut.',
    stepTutorialLayer2: () =>
      'Vérifie que les coins de la face fine se suivent : deux voisins ont la même épaisseur sur leur côté commun.',
    stepTutorialTopFace2: (done: number, pieces: readonly string[] = []) =>
      done === 0
        ? 'Aucun coin n’a encore sa face épaisse en haut : la formule suivante s’en charge.'
        : pieces.length === 1
          ? `Vérifie que ${pieces[0]} a maintenant sa face épaisse en haut.`
          : pieces.length > 1
            ? `Vérifie que ${listFr(pieces)} ont maintenant leur face épaisse en haut.`
            : `Vérifie que ${done} coins ont maintenant leur face épaisse en haut.`,
  } as Record<string, (done: number, pieces?: readonly string[]) => string>,
  figures: {
    figureDot:
      'Repère les faces épaisses du haut : le centre seul, aucune arête n’a sa face épaisse dessus.',
    figureL: 'Repère les faces épaisses du haut : un L, tenu derrière et à gauche.',
    figureLine: 'Repère les faces épaisses du haut : une ligne, tenue de gauche à droite.',
    figureEdgesTurn:
      'Repère les arêtes du haut : un tour du haut suffit à les aligner toutes avec leur centre.',
    figureEdgesSide: 'Repère les deux arêtes du haut alignées avec leur centre, côte à côte.',
    figureEdgesFacing:
      'Repère les arêtes du haut alignées avec leur centre : deux face à face, ou aucune.',
    figureCornersOne:
      'Repère le coin du haut déjà à sa place, même mal tourné : il reste devant à droite.',
    figureCornersNone: 'Aucun coin du haut n’est encore à sa place : la formule en placera un.',
    figureCornersTwist:
      'Repère les coins du haut dont la face épaisse n’est pas en haut : chacun passe devant à droite pour être tourné.',
    figureLayer2Once:
      'Repère les coins de la face fine : la formule 1 en fait tourner trois et garde celui de derrière à gauche. Une fois suffit ici.',
    figureLayer2Twice:
      'Repère les coins de la face fine : la formule 1 en fait tourner trois et garde celui de derrière à gauche. Il faudra la jouer deux fois.',
    figureTurnOver2:
      'La face fine est faite : retourne le cube, face fine en bas. La face épaisse est maintenant en haut.',
    figureFace2Case1:
      'Cas 1 : un seul coin a sa face épaisse en haut. Tiens le cube comme indiqué : la formule 2.',
    figureFace2Case2:
      'Cas 2 : un seul coin a sa face épaisse en haut, les autres tournés dans l’autre sens. Tiens le cube comme indiqué : la formule 3.',
    figureFace2Case3:
      'Cas 3 : aucun coin n’a sa face épaisse en haut, deux faces épaisses devant et deux derrière. Deux fois la formule 2.',
    figureFace2Case4:
      'Cas 4 : aucun coin n’a sa face épaisse en haut, deux faces épaisses d’un seul côté. La formule 2, un quart de tour du haut, puis la formule 2.',
    figureFace2Case5:
      'Cas 5 : deux coins en diagonale ont leur face épaisse en haut. La formule 2, un demi-tour du haut, puis la formule 3.',
    figureFace2Case6:
      'Cas 6 : deux coins voisins ont leur face épaisse en haut, les deux autres la tournent vers des côtés opposés. La formule 2, un quart de tour du haut, puis la formule 3.',
    figureFace2Case7:
      'Cas 7 : deux coins voisins ont leur face épaisse en haut, les deux autres la tournent du même côté. La formule 2, un quart de tour du haut, puis la formule 3.',
    figureCorners2Once:
      'Repère les coins du haut : la formule 1 en fait tourner trois et garde celui de derrière à gauche. Une fois suffit ici.',
    figureCorners2Twice:
      'Repère les coins du haut : la formule 1 en fait tourner trois et garde celui de derrière à gauche. Il faudra la jouer deux fois.',
    figureCorners2Turn: 'Les coins du haut se suivent déjà : un tour du haut les met en place.',
  } as Record<string, string>,
  progress: {
    stepTutorialTopCross: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} face épaisse vers le haut`,
    stepTutorialTopTwist: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} face épaisse en haut`,
    stepTutorialFace2: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} face fine en haut`,
    stepTutorialTopFace2: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} face épaisse en haut`,
  } as Record<string, (done: number, total: number) => string>,
  titles: {
    stepTutorialCross: 'Construire la croix de la face fine',
    stepTutorialCorner: 'Placer les coins de la face fine',
    stepTutorialTopCross: 'Construire la croix de la face épaisse',
    stepTutorialTopEdges: 'Placer les arêtes du haut',
    stepTutorialTopCorners: 'Placer les coins du haut',
    stepTutorialTopTwist: 'Tourner les coins du haut',
    stepTutorialFace2: 'Construire la face fine',
    stepTutorialLayer2: 'Placer les coins de la face fine',
    stepTutorialTopFace2: 'Construire la face épaisse',
    stepTutorialTopCorners2: 'Placer les coins du haut',
  } as Record<string, string>,
  hints: {
    stepTutorialOllParity4:
      'Sur un 4x4, une paire peut se retrouver seule à l’envers, ce qu’aucun 3x3 ne permet. On la retourne avant de construire la croix de la face épaisse.',
    stepTutorialPllParity4:
      'Sur un 4x4, deux paires peuvent se retrouver échangées seules, ce qu’aucun 3x3 ne permet. On les échange avant de placer les arêtes du haut.',
    stepTutorialCenters4:
      'Regroupe un à un les quatre centres de chaque épaisseur sur leur face : la face fine en bas, la face épaisse en haut, puis les quatre autres autour.',
    stepTutorialCross:
      'Place une à une les quatre arêtes qui ont une face fine, cette face en bas.',
    stepTutorialCorner: 'Place un à un les quatre coins qui ont une face fine, cette face en bas.',
    stepTutorialMiddle:
      'Place une à une les quatre arêtes de la deuxième couronne, celles qui n’ont ni face fine ni face épaisse.',
    stepTutorialTopCross:
      'Tourne les arêtes du haut pour que toutes leurs faces épaisses soient vers le haut.',
    stepTutorialTopEdges:
      'Aligne chaque arête du haut avec le centre de sa face : même épaisseur, sans marche.',
    stepTutorialTopCorners:
      'Place chaque coin du haut entre ses trois centres, même s’il est mal tourné.',
    stepTutorialTopTwist:
      'Tourne chaque coin du haut pour que sa face épaisse soit en haut. La première couche se défait en route : continue, elle se refait à la fin.',
    stepTutorialFace2:
      'Tiens le cube face fine en haut. Amène un à un les coins qui ont une face fine en haut, cette face vers le haut, sans t’occuper des côtés.',
    stepTutorialLayer2:
      'La face fine toujours en haut, place ses coins avec la formule 1 : elle fait tourner trois coins du haut sans les retourner, celui de derrière à gauche ne bougeant pas.',
    stepTutorialTopFace2:
      'Retourne le cube, face fine en bas, puis tourne les coins du haut pour que leur face épaisse soit en haut : sept cas, chacun avec la formule 2 ou la formule 3, ou les deux.',
    stepTutorialTopCorners2:
      'Place chaque coin du haut à sa place avec la formule 1, comme ceux de la face fine.',
  } as Record<string, string>,
}
