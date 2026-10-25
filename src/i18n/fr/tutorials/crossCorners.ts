import type { TutorialTexts } from '../../tutorialTexts'

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

/** The texts of the 3x3 tutorial "cross then corners"
 *  (lib/tutorials/standard/crossCorners.ts), by key: no color named, so
 *  that they hold on a mirror cube too. */
export const CROSS_CORNERS_FR: TutorialTexts = {
  checks: {
    stepTutorialCrossCornersMiddle: (done: number) =>
      done === 4
        ? 'Vérifie que les quatre arêtes du milieu sont maintenant dans leur case (une arête retournée l’est ensuite).'
        : 'Vérifie que la croix n’a pas bougé : une arête du milieu de plus approche de sa place, même retournée.',
    stepTutorialCrossCornersTopEdges: (done: number) =>
      done === 4
        ? 'Vérifie que toutes les arêtes sont maintenant à leur place.'
        : 'Vérifie que la croix et les arêtes du milieu n’ont pas bougé.',
    stepTutorialCrossCornersBottom: (done: number) =>
      done === 4
        ? 'Vérifie que les quatre coins du bas sont à leur place, même mal tournés.'
        : 'Vérifie que les arêtes n’ont pas bougé : seuls des coins tournent.',
    stepTutorialCrossCornersTop: (done: number) =>
      done === 4
        ? 'Vérifie que les huit coins sont à leur place, même mal tournés.'
        : 'Vérifie que les arêtes n’ont pas bougé : seuls des coins tournent.',
  },
  placed: {
    stepTutorialCrossCornersTwist: (piece: string) =>
      `Vérifie que ${piece} est maintenant bien tourné.`,
  },
  figures: {
    figureCrossCornersTop:
      'Tourne la face opposée à la croix pour amener l’arête au bon endroit (rien d’autre n’y est encore fait).',
    figureCrossCornersSwap:
      'La formule échange les deux arêtes du haut devant et à gauche (elle retourne au passage l’arête de droite).',
    figureCrossCornersSwapTwice:
      'Jouée deux fois de suite, la formule retourne sur place les deux arêtes du haut devant et à gauche.',
    figureCrossCornersTopSwap:
      'Tourne la face opposée à la croix pour amener l’arête au bon endroit, puis la formule échange les deux arêtes du haut devant et à gauche (elle retourne au passage l’arête de droite).',
    figureCrossCornersTopSwapTwice:
      'Tourne la face opposée à la croix pour amener l’arête au bon endroit, puis la formule, jouée deux fois de suite, retourne sur place les deux arêtes du haut devant et à gauche.',
    figureCrossCornersCycle:
      'La formule fait tourner trois coins de la face avant : celui du bas à gauche monte en haut à gauche, qui passe en haut à droite, qui descend en bas à gauche.',
  },
  progress: {
    stepTutorialCrossCornersMiddle: (done: number, total: number) =>
      `${plural(done, 'arête')} sur ${total} dans ${done > 1 ? 'leur' : 'sa'} case`,
    stepTutorialCrossCornersTopEdges: (done: number, total: number) =>
      `${plural(done, 'arête')} sur ${total} en place`,
    stepTutorialCrossCornersBottom: (done: number, total: number) =>
      `${plural(done, 'coin')} sur ${total} à sa place`,
    stepTutorialCrossCornersTop: (done: number, total: number) =>
      `${plural(done, 'coin')} sur ${total} à sa place`,
    stepTutorialCrossCornersTwist: (done: number, total: number) =>
      `${plural(done, 'coin')} sur ${total} bien tourné${done > 1 ? 's' : ''}`,
  },
  titles: {
    stepTutorialCrossCornersMiddle: 'Placer les arêtes du milieu',
    stepTutorialCrossCornersTopEdges: 'Placer les arêtes du haut',
    stepTutorialCrossCornersBottom: 'Placer les coins du bas',
    stepTutorialCrossCornersTop: 'Placer les coins du haut',
    stepTutorialCrossCornersTwist: 'Tourner les coins',
  },
  hints: {
    stepTutorialCrossCornersMiddle:
      'Une seule formule : elle échange les deux arêtes du haut devant et à gauche, et jouée deux fois elle les retourne sur place. Tourne le cube pour mettre en haut la face de l’arête à placer, et tourne la face opposée à la croix pour l’amener.',
    stepTutorialCrossCornersTopEdges:
      'La même formule, la face opposée à la croix en haut : elle échange deux arêtes voisines, jouée deux fois elle les retourne. Les coins suivront.',
    stepTutorialCrossCornersBottom:
      'Une nouvelle formule : elle fait tourner trois coins de la face avant sans toucher aux arêtes. Place les quatre coins du bas, même mal tournés : la dernière étape les redressera.',
    stepTutorialCrossCornersTop:
      'La même formule place les coins du haut, en tenant le cube de façon à garder ceux du bas à leur place à la fin.',
    stepTutorialCrossCornersTwist:
      'Une dernière formule : elle fait pivoter les deux coins du haut à droite, l’un dans un sens, l’autre dans l’autre. Clique sur un coin mal tourné pour le choisir : le cube se tourne pour l’amener à cet endroit.',
  },
}
