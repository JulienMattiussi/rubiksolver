import type { TutorialTexts } from '../../tutorialTexts'

/** The 5x5 tutorial's texts (lib/tutorials/standard/cube5.ts), by key; its
 *  3x3 stages keep the 3x3's. */
export const CUBE5_FR: TutorialTexts = {
  checks: {
    stepTutorialPair5: (done: number) =>
      done === 24
        ? 'Vérifie que les douze arêtes sont complètes : le cube se résout maintenant comme un 3x3.'
        : 'Vérifie qu’une aile de plus est maintenant collée à son arête centrale, et que les centres sont restés entiers.',
    stepTutorialParity5: () =>
      'Vérifie que les deux ailes de l’arête de devant se sont échangées, le reste intact.',
  },
  figures: {
    figurePairEdge5:
      'Repère les ailes qui scintillent : la tranche en emmène une, la formule retourne l’arête de devant droite, la tranche revient avec l’aile qui manquait.',
    figureEdgeParity5:
      'Une seule arête a ses deux ailes échangées : c’est la parité des arêtes, impossible sur un 3x3. Une formule de tranches les échange seules.',
  },
  terms: {
    termFixedCenter:
      'Le **centre fixe** : la pièce au milieu de chaque face. Il ne bouge jamais et donne la couleur de sa face.',
    termCenter5:
      'Un **centre** : une des huit pièces autour du centre fixe, avec une seule face visible.',
    termMidge:
      'Une **arête centrale** : la pièce au milieu d’un bord. Comme le centre fixe, c’est elle qui dit les couleurs de son arête.',
    termWing5:
      'Une **aile** : une des deux pièces de chaque côté d’une arête centrale. Il faut les ramener à côté de l’arête centrale de leurs couleurs.',
    termEdge5:
      'Une **arête complète** : une arête centrale et ses deux ailes, côte à côte et dans le même sens.',
    termInner5: 'Une **tranche intérieure** : une des trois couches du milieu.',
  },
  progress: {
    stepTutorialCenters5: (done: number, total: number) =>
      `${done} centre${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialPair5: (done: number, total: number) =>
      `${done} aile${done > 1 ? 's' : ''} sur ${total} à côté de leur arête centrale`,
    stepTutorialParity5: (done: number) =>
      done ? 'Parité des arêtes corrigée' : 'Parité des arêtes à corriger',
  },
  titles: {
    stepTutorialCenters5: 'Placer les centres',
    stepTutorialPair5: 'Compléter les arêtes',
    stepTutorialParity5: 'Corriger la parité des arêtes',
  },
  hints: {
    stepTutorialCenters5:
      'Ramène un à un les huit centres de chaque couleur autour de son centre fixe : le jaune en bas, le blanc en haut, puis le vert, le rouge, le bleu et l’orange autour. Tant que la face est ouverte, une tranche et un tour suffisent ; ensuite, un commutateur (une tranche, un tour, la tranche défaite, le tour défait) garde les faces finies entières.',
    stepTutorialPair5:
      'Colle une à une les ailes à côté de l’arête centrale de leurs couleurs. Une tranche emmène une aile, la formule retourne l’arête de devant droite, la tranche revient : les centres restent entiers.',
    stepTutorialParity5:
      'Sur un 5x5, la dernière arête peut garder ses deux ailes échangées, ce qu’aucune formule d’arêtes ne corrige. Une formule de tranches les échange avant de passer au 3x3.',
  },
}
