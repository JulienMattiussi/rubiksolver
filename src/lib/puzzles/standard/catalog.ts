import type { PuzzleEntry } from '../entry'

/** The NxNxN cubes and their super versions. In the picker's order. */
export const STANDARD = {
  '2': {
    label: '2x2 (Pocket)',
    slug: '2x2',
    dims: [2, 2, 2],
    scramble: 11,
    mirror: true,
    scanTried: true,
  },
  '3': {
    home: 'classic',
    cover: true,
    label: '3x3',
    slug: '3x3',
    dims: [3, 3, 3],
    scramble: 20,
    advanced: ['slice', 'wide'],
    mirror: true,
    scanTried: true,
  },
  '4': {
    home: 'mirror',
    label: '4x4 (Revenge)',
    slug: '4x4',
    dims: [4, 4, 4],
    scramble: 40,
    inner: ['slice', 'wide'],
    mirror: true,
    scanTried: true,
  },
  '5': {
    label: '5x5 (Professor)',
    slug: '5x5',
    dims: [5, 5, 5],
    scramble: 60,
    inner: ['slice', 'slice3', 'wide'],
  },
  '6': {
    label: '6x6',
    slug: '6x6',
    dims: [6, 6, 6],
    scramble: 80,
    inner: ['slice', 'slice3', 'wide', 'wide3'],
  },
  // The Super Revenge and Super Professor (superCube.ts): their centers each their own, bordered with the colors around their home.
  super4: {
    label: 'Super Revenge',
    slug: 'super-revenge',
    dims: [4, 4, 4],
    scramble: 40,
    inner: ['slice', 'wide'],
  },
  super5: {
    label: 'Super Professor',
    slug: 'super-professor',
    dims: [5, 5, 5],
    scramble: 60,
    inner: ['slice', 'slice3', 'wide'],
  },
} satisfies Record<string, PuzzleEntry>
