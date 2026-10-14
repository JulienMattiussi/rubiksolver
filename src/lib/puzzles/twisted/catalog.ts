import type { PuzzleEntry } from '../entry'

/** The odd ones: bandaged, shape mods, one-way faces. In the picker's order. */
export const TWISTED = {
  // The Violet (violet.ts) turns on a 5x5's outer slabs: its pieces sit within +-3, in half mini cubes about its off-center core.
  violet: { label: 'Violet', slug: 'violet', dims: [5, 5, 5], scramble: 25, shifts: true },
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
  // The AI Cube (ai.ts): a 4x4x4, four of its octants fused.
  ai: {
    label: 'AI Cube',
    slug: 'ai-cube',
    dims: [4, 4, 4],
    scramble: 30,
    shifts: true,
    inner: ['slice', 'wide'],
  },
  // The RoadBlock-I (roadblock.ts): a 5x5x5, its centers fused in bars.
  roadblock: {
    label: 'RoadBlock-I',
    slug: 'roadblock-i',
    dims: [5, 5, 5],
    scramble: 40,
    inner: ['slice', 'slice3', 'wide'],
    editHint: 'roadblock',
  },
} satisfies Record<string, PuzzleEntry>
