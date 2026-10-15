import type { PuzzleEntry } from '../entry'

/** The odd ones: shape mods, an off-center core, one-way faces. In the
 *  picker's order. */
export const TWISTED = {
  // The Purple (purple.ts) turns on a 5x5's outer slabs: its pieces sit within +-3, in half mini cubes about its off-center core.
  purple: { label: 'Purple', slug: 'purple', dims: [5, 5, 5], scramble: 25, shifts: true },
  // The Z-Twist (twist.ts): a 3x3x3, shaped otherwise.
  twist: { label: 'Z-Twist', slug: 'z-twist', dims: [3, 3, 3], scramble: 20, editHint: 'twist' },
  // The Quarter Cube (quarter.ts): a 3x3x3, its faces turning by turns.
  quarter: {
    label: 'Quarter Cube',
    slug: 'quarter-cube',
    dims: [3, 3, 3],
    scramble: 30,
    editHint: 'quarter',
  },
} satisfies Record<string, PuzzleEntry>
