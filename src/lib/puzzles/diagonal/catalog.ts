import type { PuzzleEntry } from '../entry'

/** The cubes cut along diagonals. In the picker's order. */
export const DIAGONAL = {
  dino: { label: 'Dino Cube', slug: 'dino-cube', dims: [3, 3, 3], scramble: 20, pad: 'dino' },
  // The Rex Cube's pieces sit within +-4 (shared/rainbow.ts), its box says so.
  rex: { label: 'Rex Cube', slug: 'rex-cube', dims: [9, 9, 9], scramble: 25, pad: 'rex' },
  // The Fisher Cube (fisher.ts): a 3x3x3 cut to a cube turned an eighth.
  fisher: { label: 'Fisher Cube', slug: 'fisher-cube', dims: [3, 3, 3], scramble: 20 },
  // The Windmill (fisher.ts): the same, its solid turned less.
  windmill: { label: 'Windmill', slug: 'windmill', dims: [3, 3, 3], scramble: 20 },
} satisfies Record<string, PuzzleEntry>
