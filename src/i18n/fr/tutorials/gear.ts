import type { TutorialTexts } from '../../tutorialTexts'

/** The Gear Cube Ultimate tutorial's texts (lib/tutorials/gear/), by key. */
export const GEAR_FR: TutorialTexts = {
  checks: {
    stepGearEdges: (done: number) =>
      done === 12
        ? 'Vérifie que chaque arête est entre ses deux couleurs, même si ses agrafes sont à l’envers.'
        : 'Vérifie que deux paires d’arêtes ont changé de place, les coins revenus chez eux.',
    stepGearClips: (done: number) =>
      done === 12
        ? 'Vérifie que chaque agrafe a la couleur de sa face.'
        : 'Vérifie que les agrafes de huit arêtes se sont retournées, rien d’autre n’ayant bougé.',
    stepGearSpins: (done: number) =>
      done === 12
        ? 'Vérifie que chaque engrenage est droit, à l’endroit : le Gear Cube est résolu.'
        : 'Vérifie que les quatre engrenages de la tranche ont pivoté d’un tiers de tour.',
  },
  figures: {
    figureGearSwap:
      'Repère les arêtes qui ne sont pas entre leurs couleurs : deux coups de la même face font faire un demi-tour à la tranche voisine, deux paires d’arêtes échangées.',
    figureGearClips:
      'Repère les arêtes dont les agrafes sont à l’envers : la formule retourne celles de huit arêtes, les engrenages revenant tels quels.',
    figureGearSpin:
      'Repère les engrenages de travers : quatre coups de la même face les font pivoter d’un tiers de tour, toute la tranche à la fois.',
  },
  terms: {
    termGearCorner:
      'Un **coin** : une pièce à trois faces, à chaque sommet du cube. On les place en premier : ils disent quelle couleur prendra chaque face.',
    termGearCenter:
      'Un **centre** : le petit carré au milieu de chaque face. C’est lui qu’on regarde pour tenir le cube.',
    termGearEdge:
      'Une **arête** : une pièce au milieu d’un bord du cube, entre deux coins. C’est un **engrenage**, une roue dentée qui pivote sur elle-même quand l’arête se déplace, et ne se remboîte qu’à un demi-tour près.',
    termGearClip:
      'Une **agrafe** : le U coloré sous l’engrenage, au bord de chaque face d’une arête, deux par arête. Les agrafes suivent l’arête, pas son pivot.',
    termGearMove:
      'Un **coup** : un demi-tour d’une face. La couche du milieu à côté d’elle, sa **tranche**, tourne d’un quart dans le même sens, ses quatre engrenages pivotent.',
  },
  progress: {
    stepGearCorners: (done: number, total: number) =>
      `${done} coin${done > 1 ? 's' : ''} sur ${total} en place`,
    stepGearEdges: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} entre ses couleurs`,
    stepGearClips: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} à l’endroit`,
    stepGearSpins: (done: number, total: number) =>
      `${done} engrenage${done > 1 ? 's' : ''} sur ${total} droit${done > 1 ? 's' : ''}`,
  },
  titles: {
    stepGearCorners: 'Placer les coins',
    stepGearEdges: 'Placer les arêtes',
    stepGearClips: 'Retourner les agrafes',
    stepGearSpins: 'Redresser les engrenages',
  },
  hints: {
    stepGearCorners:
      'Place les coins un à un, chacun avec ses couleurs sur ses faces : ils disent quelle couleur prend chaque face.',
    stepGearEdges:
      'Place chaque arête entre ses deux couleurs, en échangeant les arêtes deux paires à la fois.',
    stepGearClips: 'Retourne les agrafes à l’envers, pour que chacune ait la couleur de sa face.',
    stepGearSpins:
      'Fais pivoter les engrenages de travers, une tranche à la fois : le Gear Cube est alors résolu.',
  },
}
