import type { PuzzleEntry } from '../entry'

/** The octahedra, the dodecahedra and the Rainbow. In the picker's order. */
export const POLYHEDRON = {
  // The 4-Trajber's Octahedron is a 4x4x4 cut to an octahedron (oct4.ts).
  oct4: {
    label: "4-Trajber's Octahedron",
    slug: '4-trajber',
    dims: [4, 4, 4],
    scramble: 40,
    inner: ['slice'],
  },
  // The Octahedron VTO is a 3x3x3 cut to an octahedron, its tips apart: it turns on a 5x5's grid (vto.ts).
  vto: { label: 'Octahedron VTO', slug: 'vto', dims: [5, 5, 5], scramble: 25, inner: ['wide'] },
  // The GEM-0 is the VTO with its tips cut flat (vto.ts).
  gem: { label: 'GEM-0 (Jewel)', slug: 'gem-0', dims: [3, 3, 3], scramble: 25 },
  // The FTO (fto.ts, on the Rainbow's model): its pieces within +-3.
  fto: { label: 'FTO', slug: 'fto', dims: [7, 7, 7], scramble: 30, pad: 'fto' },
  // The Rainbow (shared/rainbow.ts) is no grid: its pieces sit within +-1.
  rainbow: { label: 'Rainbow', slug: 'rainbow', dims: [3, 3, 3], scramble: 20, pad: 'rainbow' },
  // The Megaminx (megaminx.ts) is no grid: its slots are numbered within +-4, which says nothing of where they are.
  megaminx: { label: 'Megaminx', slug: 'megaminx', dims: [9, 9, 9], scramble: 40, pad: 'mega' },
  // The Pyraminx Crystal: the Megaminx cut deeper, without centers.
  crystal: {
    label: 'Pyraminx Crystal',
    slug: 'pyraminx-crystal',
    dims: [9, 9, 9],
    scramble: 40,
    pad: 'crystal',
  },
  // The Skewb Ultimate (shared/rainbow.ts): its pieces sit within +-1.
  skewbU: {
    label: 'Skewb Ultimate',
    slug: 'skewb-ultimate',
    dims: [3, 3, 3],
    scramble: 25,
    pad: 'skewb',
  },
} satisfies Record<string, PuzzleEntry>
