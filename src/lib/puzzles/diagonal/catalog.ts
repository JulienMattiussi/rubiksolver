import type { PuzzleEntry } from '../entry'

/** The cubes cut along diagonals. In the picker's order. */
export const DIAGONAL = {
  dino: {
    moves: 'rainbow',
    label: 'Dino Cube',
    slug: 'dino-cube',
    dims: [3, 3, 3],
    scramble: 20,
    pad: 'dino',
  },
  // The Skewb (shared/rainbow.ts): its corners turn half the cube.
  skewb: {
    moves: 'rainbow',
    label: 'Skewb',
    slug: 'skewb',
    dims: [3, 3, 3],
    scramble: 15,
    pad: 'skewb',
    scanTried: true,
  },
  // The Master Skewb (shared/rainbow.ts): the Skewb and the Rex Cube in
  // one; its pieces within +-4, its box says so.
  masterSkewb: {
    moves: 'rainbow',
    label: 'Master Skewb',
    slug: 'master-skewb',
    dims: [9, 9, 9],
    scramble: 30,
    pad: 'masterSkewb',
  },
  // The Curvy Copters (copter.ts): half turns about the cube's edges.
  copter: {
    moves: 'copter',
    label: 'Curvy Copter',
    slug: 'curvy-copter',
    dims: [9, 9, 9],
    scramble: 30,
    pad: 'copter',
  },
  copter3: {
    moves: 'copter',
    label: 'Curvy Copter III',
    slug: 'curvy-copter-iii',
    dims: [13, 13, 13],
    scramble: 30,
    pad: 'copter',
  },
  // The Rex Cube's pieces sit within +-4 (shared/rainbow.ts), its box says so.
  rex: {
    moves: 'rainbow',
    label: 'Rex Cube',
    slug: 'rex-cube',
    dims: [9, 9, 9],
    scramble: 25,
    pad: 'rex',
  },
  // The Fisher Cube (fisher.ts): a 3x3x3 cut to a cube turned an eighth.
  fisher: { label: 'Fisher Cube', slug: 'fisher-cube', dims: [3, 3, 3], scramble: 20 },
  // The Windmill (fisher.ts): the same, its solid turned less.
  windmill: { label: 'Windmill', slug: 'windmill', dims: [3, 3, 3], scramble: 20 },
} satisfies Record<string, PuzzleEntry>
