import type { PuzzleEntry } from '../entry'

/** The cuboids that are not flat: towers, Domino, Camouflage. In the picker's order. */
export const TOWER = {
  '223': {
    label: '2x2x3 (Slim Tower)',
    slug: 'slim-tower',
    dims: [2, 3, 2],
    scramble: 20,
    inner: ['wide'],
  },
  // Sold blue below, yellow behind.
  '224': {
    home: 'classic',
    label: '2x2x4',
    slug: '2x2x4',
    dims: [2, 4, 2],
    scramble: 25,
    shifts: true,
    inner: ['wide'],
    scheme: { D: 'B', B: 'Y' },
    scanTried: true,
  },
  // The 2x3x4 (tower234.ts): its side columns turn by quarters, out of its box.
  '234': {
    label: '2x3x4',
    slug: 'tower-2x3x4',
    dims: [3, 4, 2],
    scramble: 25,
    shifts: true,
    inner: ['slice', 'wide'],
  },
  '332': { label: '3x3x2 (Domino)', slug: 'domino', dims: [3, 2, 3], scramble: 20 },
  // The towers (fan2cube.fr/towerXYZ1): cuboids, their sides by halves.
  '334': {
    label: '3x3x4',
    slug: 'tower-3x3x4',
    dims: [3, 4, 3],
    scramble: 30,
    inner: ['slice', 'wide'],
  },
  '443': {
    label: '4x4x3',
    slug: 'tower-4x4x3',
    dims: [4, 3, 4],
    scramble: 30,
    inner: ['slice', 'wide'],
  },
  '445': {
    label: '4x4x5',
    slug: 'tower-4x4x5',
    dims: [4, 5, 4],
    scramble: 40,
    inner: ['slice', 'wide'],
  },
  '554': {
    label: '5x5x4',
    slug: 'tower-5x5x4',
    dims: [5, 4, 5],
    scramble: 40,
    inner: ['slice', 'wide'],
  },
  // The Camouflage 4x4x2 (camo.ts): a 4x4x4 two pieces tall, bandaged.
  camo: {
    label: 'Camouflage 4x4x2',
    slug: 'camouflage',
    dims: [4, 2, 4],
    scramble: 40,
    shifts: true,
    inner: ['slice', 'wide'],
    editHint: 'camo',
  },
} satisfies Record<string, PuzzleEntry>
