import type { TutorialTexts } from '../../tutorialTexts'
import { listFr } from '../list'

/** The 2x2 tutorial's texts (lib/tutorials/standard/cube2.ts), by key. */
export const CUBE2_FR: TutorialTexts = {
  checks: {
    stepTutorialTurnOver2: () => 'Vérifie qu’un coin jaune a maintenant son jaune en bas.',
    stepTutorialTopFace2: (done: number, pieces: readonly string[] = []) =>
      done === 0
        ? 'Aucun coin n’a encore son blanc en haut : la formule suivante s’en charge.'
        : pieces.length === 1
          ? `Vérifie que ${pieces[0]} a maintenant son blanc en haut.`
          : pieces.length > 1
            ? `Vérifie que ${listFr(pieces)} ont maintenant leur blanc en haut.`
            : `Vérifie que ${done} coins ont maintenant leur blanc en haut.`,
    stepTutorialTopCorners2: () => 'Vérifie que chaque coin est à sa place : le cube est résolu.',
  },
  figures: {
    figureTopNone: 'Repère les coins du haut : aucun n’a son blanc en haut.',
    figureTopOne: 'Repère les coins du haut : un seul a son blanc en haut.',
    figureTopOneDetour:
      'Repère les coins du haut : un seul a son blanc en haut. Ici, aucune formule aussi courte ne le garde : celle-ci le défait, mais mène tout droit à la face blanche.',
    figureTopTwo: 'Repère les coins du haut : deux ont leur blanc en haut.',
    figureTopTwoDetour:
      'Repère les coins du haut : deux ont leur blanc en haut. Ici, aucune formule aussi courte ne les garde : celle-ci n’en laisse qu’un, mais mène tout droit à la face blanche.',
    figureCornersTurn:
      'Les coins blancs se suivent déjà dans le bon ordre : un tour du haut les met en place.',
    figureCornersAdjacent:
      'Deux coins voisins sont à échanger : amenés à droite, la formule échange les deux coins de droite.',
    figureCornersDiagonal:
      'Deux coins en diagonale sont à échanger : c’est la parité du 2x2, qu’une formule à part corrige.',
  },
  progress: {
    stepTutorialCorner2: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialTopFace2: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} blanc en haut`,
    stepTutorialTopCorners2: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} à sa place`,
  },
  titles: {
    stepTutorialTurnOver2: 'Retourner le cube, jaune en bas',
    stepTutorialCorner2: 'Placer les coins jaunes',
    stepTutorialTopFace2: 'Construire la face blanche',
    stepTutorialTopCorners2: 'Placer les coins blancs',
  },
  hints: {
    stepTutorialTurnOver2:
      'Le 2x2 n’a pas de centres : un coin jaune dont le jaune est en bas sert de repère. Aucun n’a son jaune en bas : retourne le cube pour en amener un. Aucune face ne tourne.',
    stepTutorialCorner2:
      'Le 2x2 n’a pas de centres : un coin jaune déjà jaune en bas sert de repère, et les couleurs des faces se lisent sur lui. Place un à un les autres coins jaunes autour de lui, jaune vers le bas.',
    stepTutorialTopFace2: 'Tourne les coins du haut pour que leur blanc soit en haut.',
    stepTutorialTopCorners2:
      'Place chaque coin blanc à sa place. Deux coins en diagonale à échanger, c’est la parité du 2x2 : elle a sa propre formule.',
  },
}
