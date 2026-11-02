import type { TutorialTexts } from '../../tutorialTexts'

/** The towers' tutorials' texts (lib/tutorials/tower/: the 2x2x4 and the
 *  Slim Tower), by key. */
export const TOWER_FR: TutorialTexts = {
  holding: {
    tower: (color: string, down: string) =>
      `Tiens la tour avec devant toi le côté qui sera ${color}, et en bas celui qui sera ${down}.`,
  },
  checks: {
    stepTowerShape: (done: number) =>
      done === 8
        ? 'Vérifie que chaque barre est debout : la tour a repris sa forme.'
        : `Vérifie que ${done} barre${done > 1 ? 's' : ''} sur 8 ${done > 1 ? 'sont' : 'est'} maintenant debout. La tour ne reprend sa forme qu’une fois les huit debout.`,
  },
  figures: {
    figureTowerPivot:
      'Repère les barres couchées : si besoin, un coup large en amène deux devant, en haut, puis la formule les fait pivoter d’un seul geste.',
    figureTowerTurn:
      'Tourne une moitié de la tour : ses barres basculent avec elle, et des barres couchées se redressent.',
  },
  terms: {
    termSlimEdge:
      'Une **arête** : une pièce à deux faces, dans l’étage du milieu de la tour. Il y en a quatre.',
    termSlimMiddle:
      'Un **coup du milieu** : on tourne seulement l’étage du milieu, entre le haut et le bas.',
    termTowerCorner:
      'Un **coin** : une pièce à trois faces, aux deux bouts de la tour, quatre en haut et quatre en bas.',
    termTowerMiddle:
      'Un **milieu** : une pièce à deux faces, au milieu de la tour. Les deux milieux d’une même colonne sont jumeaux : mêmes couleurs.',
    termTowerBar:
      'Une **barre** : un coin et le milieu collé à lui. Tant qu’on ne tourne que des moitiés de tour, ils bougent ensemble.',
    termTowerInner: 'Le **Pocket intérieur** : les huit milieux, qui se résolvent comme un 2x2.',
    termTowerOuter:
      'Le **Pocket extérieur** : les huit coins, qui se résolvent ensuite de la même façon.',
    termTowerWide:
      'Un **coup large** : on tourne toute une moitié de la tour. Il est toujours possible, même s’il déforme la tour.',
    termTowerTop:
      'Un **coup d’étage** : on tourne seulement l’étage du haut (ou du bas), possible quand il forme un carré complet.',
  },
  progress: {
    stepSlimBottom: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepSlimTop: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepSlimEdges: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTowerShape: (done: number, total: number) =>
      `${done} barre${done > 1 ? 's' : ''} sur ${total} debout`,
    stepTowerInnerDown: (done: number, total: number) =>
      `${done} milieu${done > 1 ? 'x' : ''} sur ${total} en place`,
    stepTowerInnerUp: (done: number, total: number) =>
      `${done} milieu${done > 1 ? 'x' : ''} sur ${total} en place`,
    stepTowerOuterDown: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTowerOuterUp: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
  },
  titles: {
    stepSlimBottom: 'Placer les coins du bas',
    stepSlimTop: 'Placer les coins du haut',
    stepSlimEdges: 'Placer les arêtes du milieu',
    stepTowerShape: 'Remettre la tour en forme',
    stepTowerInnerDown: 'Placer les milieux du bas',
    stepTowerInnerUp: 'Placer les milieux du haut',
    stepTowerOuterDown: 'Placer les coins du bas',
    stepTowerOuterUp: 'Placer les coins du haut',
  },
  hints: {
    stepSlimBottom:
      'Place les quatre coins du bas, un par un, par quelques tours : pas de formule à cette étape, chacun la fait à sa façon.',
    stepSlimTop:
      'Les coins du bas restent en place. Deux coins opposés du haut s’échangent par une formule jouée trois fois, deux coins voisins par une autre, jouée une fois. Tourne le haut avant si besoin.',
    stepSlimEdges:
      'Il ne reste que les arêtes du milieu. Une formule les échange deux à deux ; une autre, jouée trois fois, échange deux arêtes voisines. Les coins ne bougent plus.',
    stepTowerShape:
      'Redresse les barres couchées, deux à la fois, par des coups larges : la tour retrouve sa forme.',
    stepTowerInnerDown:
      'Le Pocket intérieur se résout comme un 2x2, par des coups larges : descends chaque milieu du bas à sa place.',
    stepTowerInnerUp:
      'Échange les milieux du haut deux à deux, par des coups larges, jusqu’à ce que le Pocket intérieur soit résolu.',
    stepTowerOuterDown:
      'Même chose pour le Pocket extérieur, par des coups d’étage : descends les coins du bas. Ils descendent deux par deux : la formule retourne la moitié avant du Pocket intérieur, la suivante la remet.',
    stepTowerOuterUp: 'Échange les coins du haut deux à deux : la tour est alors résolue.',
  },
}
