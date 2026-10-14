import type { PuzzleEntry } from '../entry'

/** The tetrahedra: the Pyraminx family, the Morphinxes. In the picker's order. */
export const PYRAMID = {
  // The Pyraminx family (pyraminx.ts) is no grid either: its pieces sit within +-2, +-3 and +-4 on every axis by size (see `pyraSize`).
  pyra: { label: 'Pyraminx', slug: 'pyraminx', dims: [5, 5, 5], scramble: 11, pad: 'pyra' },
  tetra: { label: 'Tetraminx', slug: 'tetraminx', dims: [5, 5, 5], scramble: 11, pad: 'pyra' },
  pyra4: {
    label: 'Master Pyraminx (4x4)',
    slug: 'master-pyraminx',
    dims: [7, 7, 7],
    scramble: 30,
    pad: 'pyra',
  },
  pyra5: {
    label: 'Professor Pyraminx (5x5)',
    slug: 'professor-pyraminx',
    dims: [9, 9, 9],
    scramble: 40,
    pad: 'pyra',
  },
  // The Pyraminx Jing's pieces sit within +-1 (see pyraminx.ts).
  jing: {
    label: 'Pyraminx Jing',
    slug: 'pyraminx-jing',
    dims: [3, 3, 3],
    scramble: 15,
    pad: 'pyra',
  },
  // The Pyramorphinx is a 2x2 cut down to a tetrahedron (morph.ts).
  morph: {
    label: 'Pyramorphinx',
    slug: 'pyramorphinx',
    dims: [2, 2, 2],
    scramble: 11,
    shifts: true,
  },
  // The Master Morphinx (mmorph.ts): a 3x3x3 cut to a tetrahedron.
  mmorph: { label: 'Master Morphinx', slug: 'master-morphinx', dims: [3, 3, 3], scramble: 25 },
} satisfies Record<string, PuzzleEntry>
