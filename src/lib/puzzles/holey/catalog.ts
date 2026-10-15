import type { PuzzleEntry } from '../entry'

/** The puzzles with holes where their centers would be. In the picker's order. */
export const HOLEY = {
  // The Holey Megaminx: the Megaminx without its centers.
  holey: {
    label: 'Holey Megaminx',
    slug: 'holey-megaminx',
    dims: [9, 9, 9],
    scramble: 40,
    pad: 'mega',
  },
  // The Void Cube (lib/methods/holey/voidCube.ts): a 3x3x3 without its
  // centers, its slices turned in the mix.
  void: {
    label: 'Void Cube',
    slug: 'void-cube',
    dims: [3, 3, 3],
    scramble: 25,
    inner: ['slice', 'wide'],
  },
  // The Tori (tori.ts): a 3x3x3 without its corners.
  tori: { label: 'Tori', slug: 'tori', dims: [3, 3, 3], scramble: 20 },
  // The Edge Only (lib/methods/holey/edgeOnly.ts): a 3x3x3's twelve edges alone.
  edge: { label: 'Edge Only', slug: 'edge-only', dims: [3, 3, 3], scramble: 20 },
} satisfies Record<string, PuzzleEntry>
