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
  // Qiyi's mirror 2x2, sold only so: two sizes of layer (3 and 2 cm, the
  // thick ones meeting at a corner), so six of its corners go by threes of
  // twins. Read as a 2x2 of two colors, a face of each its size's.
  qiyi2: {
    label: '2x2 Qiyi',
    slug: '2x2-qiyi',
    dims: [2, 2, 2],
    scramble: 11,
    scheme: { R: 'W', B: 'W', L: 'Y', F: 'Y' },
    // In cells of 2.5 cm.
    mirror: { thickness: { W: 1.2, Y: 0.8, G: 1, B: 1, O: 1, R: 1 }, finish: 'silver' },
    mirrorScan: 'cross',
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
    mirrorScan: 'center',
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
