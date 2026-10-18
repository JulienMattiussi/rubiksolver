import type { CubeColor } from '@/lib/core/types'
import { listFr } from './tutorial'

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
  piece: (stickers: number, names: readonly string[]) =>
    stickers === 1
      ? `le centre de la face ${names[0]}`
      : `${stickers === 2 ? 'l’arête' : 'le coin'} aux faces ${listFr(names)}`,
  /** The words that change on a mirror cube, and a thickness's (the first
   *  telling what thicknesses are). */
  terms: {
    termCenter:
      'Un **centre** : la pièce au milieu d’une face, une seule face visible. Les centres ne changent pas de place : chacun donne l’épaisseur de sa face.',
  } as Record<string, string>,
  thicknessTerm: (name: string, first: boolean) =>
    `${first ? 'Sur un cube miroir, toutes les faces ont la même couleur : on les reconnaît à leur épaisseur, de très fine à très épaisse. ' : ''}En bleu, les pièces qui ont une face **${name}**.`,
  /** A side to hold in front, center or not. */
  facing: (name: string) => `Tourne vers toi la face ${name}.`,
  checkFigure: 'Vérifie la nouvelle figure que dessinent les faces épaisses en haut.',
  checks: {
    stepTutorialTurnOver2: () => 'Vérifie qu’un coin a maintenant sa face fine en bas.',
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
    figureTopNone: 'Repère les coins du haut : aucun n’a sa face épaisse en haut.',
    figureTopOne: 'Repère les coins du haut : un seul a sa face épaisse en haut.',
    figureTopOneDetour:
      'Repère les coins du haut : un seul a sa face épaisse en haut. Ici, aucune formule aussi courte ne le garde : celle-ci le défait, mais mène tout droit à la face épaisse.',
    figureTopTwo: 'Repère les coins du haut : deux ont leur face épaisse en haut.',
    figureTopTwoDetour:
      'Repère les coins du haut : deux ont leur face épaisse en haut. Ici, aucune formule aussi courte ne les garde : celle-ci n’en laisse qu’un, mais mène tout droit à la face épaisse.',
    figureCornersTurn:
      'Les coins du haut se suivent déjà dans le bon ordre : un tour du haut les met en place.',
  } as Record<string, string>,
  progress: {
    stepTutorialTopCross: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} face épaisse vers le haut`,
    stepTutorialTopTwist: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} face épaisse en haut`,
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
    stepTutorialTurnOver2: 'Retourner le cube, face fine en bas',
    stepTutorialCorner2: 'Placer les coins de la face fine',
    stepTutorialTopFace2: 'Construire la face épaisse',
    stepTutorialTopCorners2: 'Placer les coins du haut',
  } as Record<string, string>,
  hints: {
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
    stepTutorialTurnOver2:
      'Le 2x2 n’a pas de centres : un coin dont la face fine est en bas sert de repère. Aucun n’a sa face fine en bas : retourne le cube pour en amener un. Aucune face ne tourne.',
    stepTutorialCorner2:
      'Le 2x2 n’a pas de centres : un coin déjà face fine en bas sert de repère, et les épaisseurs des faces se lisent sur lui. Place un à un les autres coins qui ont une face fine autour de lui, cette face en bas.',
    stepTutorialTopFace2: 'Tourne les coins du haut pour que leur face épaisse soit en haut.',
    stepTutorialTopCorners2:
      'Place chaque coin du haut à sa place. Deux coins en diagonale à échanger, c’est la parité du 2x2 : elle a sa propre formule.',
  } as Record<string, string>,
}
