import type { TutorialTexts } from '../../tutorialTexts'

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`
/** So many pieces now in their places. */
const placed = (n: number, word: string, where: string) =>
  `${plural(n, word)} ${where} ${n > 1 ? 'sont maintenant à leur place' : 'est maintenant à sa place'}`

/** The texts of the 3x3 tutorial by Ofapel's method
 *  (lib/tutorials/standard/ofapel.ts), by key: no color named, so that
 *  they hold on a mirror cube too. */
export const OFAPEL_FR: TutorialTexts = {
  checks: {
    stepTutorialOfapelPlace: (done: number) =>
      done === 4
        ? 'Vérifie que les quatre coins du haut sont maintenant à leur place, même mal tournés.'
        : `Vérifie que ${placed(done, 'coin', 'du haut')}.`,
    stepTutorialOfapelTwist: (done: number) =>
      done === 4
        ? 'Vérifie que la face du haut est maintenant faite.'
        : done === 0
          ? 'Aucun coin du haut n’est encore bien tourné : la formule suivante s’en charge.'
          : `Vérifie que ${plural(done, 'coin')} du haut ${done > 1 ? 'sont maintenant bien tournés' : 'est maintenant bien tourné'}.`,
    stepTutorialOfapelFinish: (done: number) =>
      done === 4
        ? 'Vérifie que le cube est résolu.'
        : done === 0
          ? 'Aucune arête de la tranche du milieu n’est encore à sa place : la formule suivante s’en charge.'
          : `Vérifie que ${placed(done, 'arête', 'de la tranche du milieu')}.`,
  },
  figures: {
    figureOfapelSwap:
      'Repère deux coins du haut déjà à leur place, même mal tournés : tenus du bon côté, la formule échange les deux autres.',
    figureOfapelSwapTwice:
      'Aucun coin du haut n’est à sa place côte à côte avec un autre : la formule jouée deux fois de suite, sans son dernier demi-tour, échange les coins en diagonale.',
    figureOfapelTwistTurn:
      'Les coins du haut sont tous bien tournés : un tour du haut les remet à leur place.',
    figureOfapelTwistLast:
      'Repère les coins du haut mal tournés : tiens le cube comme indiqué, une seule formule les tourne tous.',
    figureOfapelTwistMore:
      'Repère les coins du haut mal tournés : tiens le cube comme indiqué et joue la formule, une autre suivra.',
    figureOfapelOnSide:
      'Tout est fait sauf la couronne du milieu : bascule le cube vers la droite, comme un quart de tour de la face avant. Elle devient la tranche verticale du milieu.',
    figureOfapelFinish_cycle:
      'Trois arêtes de la tranche du milieu sont à faire tourner entre elles : la formule les remet en place sans rien déranger d’autre.',
    figureOfapelFinish_swapEdges:
      'La formule déplace trois arêtes de la tranche du milieu, sans les retourner.',
    figureOfapelFinish_flip:
      'Deux arêtes de la tranche du milieu sont retournées : la formule les retourne sans rien déplacer.',
    figureOfapelFinish_rare:
      'Un cas plus rare : la formule échange deux par deux les arêtes, ou les centres, de la tranche du milieu.',
    figureOfapelFinish_slice:
      'Tourne la tranche du milieu pour remettre ses centres en face de leurs faces.',
  },
  terms: {
    termMiddleSlice:
      'La **tranche du milieu** : la couche entre la gauche et la droite. Elle tourne dans le même sens que la face de gauche.',
    termWideTop:
      'Un **coup large** : les deux couches du haut tournées ensemble, dans le sens de la face du haut.',
  },
  progress: {
    stepTutorialOfapelCorner: (done: number, total: number) =>
      `${plural(done, 'coin')} sur ${total} en place`,
    stepTutorialOfapelPlace: (done: number, total: number) =>
      `${plural(done, 'coin')} sur ${total} à sa place`,
    stepTutorialOfapelTwist: (done: number, total: number) =>
      `${plural(done, 'coin')} sur ${total} bien tourné${done > 1 ? 's' : ''}`,
    stepTutorialOfapelEdges: (done: number, total: number) =>
      `${plural(done, 'arête')} sur ${total} en place`,
    stepTutorialOfapelFinish: (done: number, total: number) =>
      `${plural(done, 'arête')} sur ${total} en place`,
  },
  titles: {
    stepTutorialOfapelCorner: 'Placer les coins du bas',
    stepTutorialOfapelPlace: 'Placer les coins du haut',
    stepTutorialOfapelTwist: 'Tourner les coins du haut',
    stepTutorialOfapelEdges: 'Placer les arêtes du haut',
    stepTutorialOfapelFinish: 'Finir par la tranche du milieu',
  },
  hints: {
    stepTutorialOfapelCorner:
      'Place un à un les quatre coins de la première face, chacun par la formule de son cas : en haut, sa face du bas sur le côté ; en haut, sa face du bas vers le haut ; déjà en bas mais mal tourné.',
    stepTutorialOfapelPlace:
      'Place les coins du haut deux par deux, même mal tournés : deux coins déjà à leur place restent d’un côté, la formule échange les deux autres.',
    stepTutorialOfapelTwist:
      'Une seule formule et sa symétrie tournent les coins du haut : jouées une ou plusieurs fois, elles font la face du haut, puis un tour du haut remet les coins à leur place.',
    stepTutorialOfapelEdges:
      'Remonte une à une les arêtes du haut depuis la couronne du milieu : amène au-dessus d’elle les deux coins qui l’encadreront, puis la formule. La couronne du milieu tourne avec : elle se règle à la fin.',
    stepTutorialOfapelFinish:
      'Il ne reste que la couronne du milieu : on bascule le cube pour en faire la tranche verticale du milieu, puis on place ses arêtes et ses centres avec quelques formules en M et U.',
  },
}
