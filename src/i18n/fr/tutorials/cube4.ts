import type { TutorialTexts } from '../../tutorialTexts'

/** The 4x4 tutorial's texts (lib/tutorials/standard/cube4.ts), by key; its
 *  3x3 stages keep the 3x3's. */
export const CUBE4_FR: TutorialTexts = {
  checks: {
    stepTutorialPair4: (done: number) =>
      done === 12
        ? 'Vérifie que les douze paires sont formées : le cube se résout maintenant comme un 3x3.'
        : 'Vérifie que deux arêtes de plus forment maintenant une paire, et que les centres sont restés entiers.',
    stepTutorialOllParity4: () =>
      'Vérifie que la paire de devant s’est retournée, les centres et les deux premières couches intacts.',
    stepTutorialPllParity4: () =>
      'Vérifie que les paires de devant et de derrière se sont échangées, le reste intact.',
  },
  figures: {
    figurePairEdge:
      'Repère les deux arêtes qui scintillent : la formule les réunit en une paire, puis remet la tranche en place.',
    figureOllParity:
      'Une seule paire du haut est à l’envers : c’est la parité OLL, impossible sur un 3x3. Une formule de tranches la retourne seule.',
    figurePllParity:
      'Deux paires du haut sont échangées : c’est la parité PLL, impossible sur un 3x3. Une formule de tranches échange celles de devant et de derrière.',
  },
  terms: {
    termCenter4:
      'Un **centre** : une des quatre pièces au milieu d’une face, ils ont une seule face visible.',
    termWing:
      'Une **arête** : une pièce à deux faces, sur un bord. Chaque couple de couleurs en a deux.',
    termEdge4:
      'Une **paire** : les deux arêtes de mêmes couleurs, côte à côte et dans le même sens.',
    termInner: 'Une **tranche intérieure** : une des deux couches du milieu.',
  },
  progress: {
    stepTutorialCenters4: (done: number, total: number) =>
      `${done} centre${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialPair4: (done: number, total: number) =>
      `${done} paire${done > 1 ? 's' : ''} sur ${total} formée${done > 1 ? 's' : ''}`,
    stepTutorialOllParity4: (done: number) =>
      done ? 'Parité OLL corrigée' : 'Parité OLL à corriger',
    stepTutorialPllParity4: (done: number) =>
      done ? 'Parité PLL corrigée' : 'Parité PLL à corriger',
  },
  titles: {
    stepTutorialCenters4: 'Regrouper les centres',
    stepTutorialPair4: 'Former les paires d’arêtes',
    stepTutorialOllParity4: 'Corriger la parité OLL',
    stepTutorialPllParity4: 'Corriger la parité PLL',
  },
  hints: {
    stepTutorialCenters4:
      'Regroupe un à un les quatre centres de chaque couleur sur leur face : le jaune en bas, le blanc en haut, puis le vert, le rouge, le bleu et l’orange autour.',
    stepTutorialPair4:
      'Réunis une à une les deux arêtes de chaque couple de couleurs. Une tranche les met côte à côte, un échange les assemble, la tranche revient : les centres restent entiers.',
    stepTutorialOllParity4:
      'Sur un 4x4, une paire peut se retrouver seule à l’envers, ce qu’aucun 3x3 ne permet. On la retourne avant de construire la croix blanche.',
    stepTutorialPllParity4:
      'Sur un 4x4, deux paires peuvent se retrouver échangées seules, ce qu’aucun 3x3 ne permet. On les échange avant de placer les arêtes blanches.',
  },
}
