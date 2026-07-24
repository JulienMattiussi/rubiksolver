// French is the source of truth; English must provide every key (enforced by
// the `Translations` type below). Values are content, not code.

const fr = {
  title: 'Rubik Solver',
  subtitle: 'Manipulez le cube, mélangez, puis laissez le solveur le résoudre.',
  moves: 'Rotations',
  scramble: 'Mélanger',
  solve: 'Résoudre',
  reset: 'Réinitialiser',
  stop: 'Arrêter',
  speed: 'Vitesse',
  statusSolved: 'Cube résolu',
  statusScrambled: 'Cube mélangé',
  statusReady: 'Prêt',
  statusPlaying: 'Animation en cours',
  statusSolving: 'Résolution',
  solutionLabel: 'Solution',
  solutionCount: (n: number) => `${n} rotation${n > 1 ? 's' : ''}`,
  emptySolution: 'Aucune solution nécessaire',
  rotateHint: 'Glissez pour tourner la vue, molette pour zoomer.',
  language: 'Langue',
}

export type Translations = typeof fr

const en: Translations = {
  title: 'Rubik Solver',
  subtitle: 'Turn the cube, scramble it, then let the solver work it out.',
  moves: 'Turns',
  scramble: 'Scramble',
  solve: 'Solve',
  reset: 'Reset',
  stop: 'Stop',
  speed: 'Speed',
  statusSolved: 'Solved',
  statusScrambled: 'Scrambled',
  statusReady: 'Ready',
  statusPlaying: 'Animating',
  statusSolving: 'Solving',
  solutionLabel: 'Solution',
  solutionCount: (n: number) => `${n} turn${n > 1 ? 's' : ''}`,
  emptySolution: 'No solution needed',
  rotateHint: 'Drag to orbit, scroll to zoom.',
  language: 'Language',
}

export const LOCALES = { fr, en }
export type Locale = keyof typeof LOCALES
