import type { PuzzleEntry } from '../entry'

/** The puzzles one layer thick. In the picker's order. */
export const FLAT = {
  '123': { label: '1x2x3', slug: '1x2x3', dims: [3, 2, 1], scramble: 10 },
  '331': { label: '3x3x1 (Floppy)', slug: 'floppy', dims: [3, 1, 3], scramble: 12 },
  // The Floppy Ghost (ghost.ts) is no grid: its slots sit within +-3 in its plane, all at z = 0.
  ghost: {
    label: 'Floppy Ghost',
    slug: 'floppy-ghost',
    dims: [7, 7, 1],
    scramble: 15,
    pad: 'ghost',
  },
} satisfies Record<string, PuzzleEntry>
