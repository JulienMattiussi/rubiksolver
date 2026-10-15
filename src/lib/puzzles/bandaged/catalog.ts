import type { PuzzleEntry } from '../entry'

/** The bandaged puzzles: blocks fused, turns jammed by them. In the
 *  picker's order: the 3x3x3s (bonds.ts, their blocks in blocks.ts), the
 *  easy ones first (as fan2cube.fr rates them), then the others, each its
 *  own module. */
export const BANDAGED = {
  // Two faces only (H and D): a 2x2x3 fused.
  bigBlock: { label: 'BigBlock', slug: 'bigblock', dims: [3, 3, 3], scramble: 25 },
  // Its equator jammed: H, B and D turn.
  squarebik: { label: 'Squarebik', slug: 'squarebik', dims: [3, 3, 3], scramble: 25 },
  // Three squares and three bars round a small inner cube.
  quadStripe: { label: 'QuadStripe', slug: 'quadstripe', dims: [3, 3, 3], scramble: 25 },
  // Two bars, five tabs.
  detour: { label: 'Detour', slug: 'detour', dims: [3, 3, 3], scramble: 25 },
  // Three faces only (H, A and D): a 2x2x2 fused.
  fused: { label: 'Fused', slug: 'fused', dims: [3, 3, 3], scramble: 25 },
  // Two squares, two tabs.
  diamond: { label: 'Diamond', slug: 'diamond', dims: [3, 3, 3], scramble: 25 },
  // Seven bars, six tabs.
  bandage: { label: 'Bandage Cube', slug: 'bandage-cube', dims: [3, 3, 3], scramble: 25 },
  // The QuadStripe's three squares alone.
  quad: { label: 'Quad', slug: 'quad', dims: [3, 3, 3], scramble: 25 },
  // Three bars in a Y.
  stripe: { label: 'Stripe', slug: 'stripe', dims: [3, 3, 3], scramble: 25 },
  // The Fused's 2x2x2 and three bars in a Y.
  fusedStripe: { label: 'FusedStripe', slug: 'fusedstripe', dims: [3, 3, 3], scramble: 25 },
  // The Fused's 2x2x2, three bars, two tabs and a square.
  alcatraz: { label: 'Alcatraz', slug: 'alcatraz', dims: [3, 3, 3], scramble: 25 },
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
