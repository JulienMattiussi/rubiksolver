import type { TutorialTexts } from '../../tutorialTexts'

/** The Pyraminx tutorial's texts (lib/tutorials/pyramid/), by key. */
export const PYRAMINX_FR: TutorialTexts = {
  holding: {
    flat: (color: string, down: string) =>
      `Place la pyramide à plat sur sa face ${down}, la face ${color} face à toi.`,
  },
  checks: {
    stepTutorialPyraTop: (done: number) =>
      done === 3
        ? 'Vérifie que les trois arêtes du haut sont entre leurs bonnes faces, même retournées.'
        : `Vérifie que ${done} arête${done > 1 ? 's' : ''} du haut ${done > 1 ? 'sont' : 'est'} maintenant entre ses bonnes faces.`,
    stepTutorialPyraFlip: (done: number) =>
      done === 6
        ? 'Vérifie que chaque arête est à l’endroit : le Pyraminx est résolu.'
        : 'Vérifie que deux arêtes de plus sont maintenant à l’endroit.',
  },
  figures: {
    figurePyraCycle:
      'Repère les arêtes du haut qui ne sont pas entre leurs bonnes faces : la formule fait tourner les trois.',
    figurePyraFlip: 'Repère les arêtes à l’envers : la formule en retourne deux à la fois.',
  },
  terms: {
    termTip:
      'Une **pointe** : la petite pièce au bout de chaque sommet. Elle tourne seule, sans rien entraîner.',
    termPyraCenter:
      'Un **centre** : la pièce juste sous la pointe, à trois faces. Il ne quitte jamais son sommet : les centres disent la couleur de chaque face.',
    termPyraEdge: 'Une **arête** : une pièce à deux faces, entre deux sommets.',
    termLayer:
      'Une **couche** : tout ce qui tourne avec un sommet, sa pointe, son centre et les trois arêtes autour.',
    termPyraClockwise:
      'Le **sens horaire** : c’est le sens des aiguilles d’une montre, en regardant le sommet qui tourne, d’en face.',
    termPyraCounterclockwise:
      'Le **sens anti-horaire** : c’est le sens inverse des aiguilles d’une montre, en regardant toujours le sommet qui tourne.',
  },
  progress: {
    stepTutorialPyraCenters: (done: number, total: number) =>
      `${done} centre${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialPyraTips: (done: number, total: number) =>
      `${done} pointe${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialPyraBottom: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialPyraTop: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} entre ses faces`,
    stepTutorialPyraFlip: (done: number, total: number) =>
      `${done} arête${done > 1 ? 's' : ''} sur ${total} à l’endroit`,
  },
  titles: {
    stepTutorialPyraCenters: 'Tourner les centres',
    stepTutorialPyraTips: 'Tourner les pointes',
    stepTutorialPyraBottom: 'Placer les arêtes du bas',
    stepTutorialPyraTop: 'Placer les arêtes du haut',
    stepTutorialPyraFlip: 'Retourner les arêtes',
  },
  hints: {
    stepTutorialPyraCenters:
      'Tourne la couche de chaque sommet jusqu’à ce que son centre ait les couleurs des trois faces autour de lui.',
    stepTutorialPyraTips: 'Tourne chaque pointe seule pour qu’elle ait les couleurs de son centre.',
    stepTutorialPyraBottom:
      'Place une à une les trois arêtes de la face du dessous, chacune entre ses deux couleurs.',
    stepTutorialPyraTop:
      'Place les trois arêtes du haut entre leurs bonnes faces, même si elles sont retournées.',
    stepTutorialPyraFlip:
      'Retourne les arêtes à l’envers, deux à la fois : le Pyraminx est alors résolu.',
  },
}
