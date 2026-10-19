import type { TutorialTexts } from '../../tutorialTexts'
import { listFr } from '../list'

/** The 2x2 tutorial's texts (lib/tutorials/standard/cube2.ts), by key. */
export const CUBE2_FR: TutorialTexts = {
  checks: {
    stepTutorialFace2: () => 'Vérifie qu’un coin jaune de plus a maintenant son jaune en haut.',
    stepTutorialLayer2: () =>
      'Vérifie que les coins jaunes se suivent : deux voisins ont la même couleur sur leur côté commun.',
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
    figureLayer2Once:
      'Repère les coins jaunes : la formule 1 en fait tourner trois et garde celui de derrière à gauche. Une fois suffit ici.',
    figureLayer2Twice:
      'Repère les coins jaunes : la formule 1 en fait tourner trois et garde celui de derrière à gauche. Il faudra la jouer deux fois.',
    figureTurnOver2:
      'La face jaune est faite : retourne le cube, jaune en bas. Le blanc est maintenant en haut.',
    figureFace2Case1:
      'Cas 1 : un seul coin a son blanc en haut. Tiens le cube comme indiqué : la formule 2.',
    figureFace2Case2:
      'Cas 2 : un seul coin a son blanc en haut, les autres tournés dans l’autre sens. Tiens le cube comme indiqué : la formule 3.',
    figureFace2Case3:
      'Cas 3 : aucun coin n’a son blanc en haut, deux blancs devant et deux derrière. Deux fois la formule 2.',
    figureFace2Case4:
      'Cas 4 : aucun coin n’a son blanc en haut, deux blancs d’un seul côté. La formule 2, un quart de tour du haut, puis la formule 2.',
    figureFace2Case5:
      'Cas 5 : deux coins en diagonale ont leur blanc en haut. La formule 2, un demi-tour du haut, puis la formule 3.',
    figureFace2Case6:
      'Cas 6 : deux coins voisins ont leur blanc en haut, les deux autres le tournent vers des côtés opposés. La formule 2, un quart de tour du haut, puis la formule 3.',
    figureFace2Case7:
      'Cas 7 : deux coins voisins ont leur blanc en haut, les deux autres le tournent du même côté. La formule 2, un quart de tour du haut, puis la formule 3.',
    figureCorners2Turn: 'Les coins blancs se suivent déjà : un tour du haut les met en place.',
    figureCorners2Once:
      'Repère les coins blancs : la formule 1 en fait tourner trois et garde celui de derrière à gauche. Une fois suffit ici.',
    figureCorners2Twice:
      'Repère les coins blancs : la formule 1 en fait tourner trois et garde celui de derrière à gauche. Il faudra la jouer deux fois.',
  },
  progress: {
    stepTutorialFace2: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} jaune en haut`,
    stepTutorialLayer2: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} à sa place`,
    stepTutorialTopFace2: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} blanc en haut`,
    stepTutorialTopCorners2: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} à sa place`,
  },
  titles: {
    stepTutorialFace2: 'Construire la face jaune',
    stepTutorialLayer2: 'Placer les coins jaunes',
    stepTutorialTopFace2: 'Construire la face blanche',
    stepTutorialTopCorners2: 'Placer les coins blancs',
  },
  hints: {
    stepTutorialFace2:
      'Tiens le cube jaune en haut. Amène un à un les coins jaunes en haut, leur jaune vers le haut, sans t’occuper des côtés.',
    stepTutorialLayer2:
      'La face jaune toujours en haut, place ses coins avec la formule 1 : elle fait tourner trois coins du haut sans les retourner, celui de derrière à gauche ne bougeant pas.',
    stepTutorialTopFace2:
      'Retourne le cube, jaune en bas, puis tourne les coins du haut pour que leur blanc soit en haut : sept cas, chacun avec la formule 2 ou la formule 3, ou les deux.',
    stepTutorialTopCorners2:
      'Place chaque coin blanc à sa place avec la formule 1, comme les jaunes.',
  },
}
