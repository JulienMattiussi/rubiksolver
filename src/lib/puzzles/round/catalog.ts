import type { PuzzleEntry } from '../entry'

/** The round ones: the star prisms, the Hockey Puck, the Dino Cylinder, the Barrel. In the picker's order. */
export const ROUND = {
  // The Dino Cylinder (dinoCyl.ts): the Dino's, its corners added.
  dinoCyl: {
    label: 'Dino Cylinder',
    slug: 'dino-cylinder',
    dims: [3, 3, 3],
    scramble: 25,
    pad: 'dino',
  },
  // The Hockey Puck (puck.ts) is no grid: its slots sit within +-6 in its plane, one layer thick.
  puck: { label: 'Hockey Puck', slug: 'hockey-puck', dims: [13, 13, 1], scramble: 25, pad: 'puck' },
  // The Barrel (barrel.ts): a 3x3x3, its upright edges cut off.
  barrel: { label: 'Barrel', slug: 'barrel', dims: [3, 3, 3], scramble: 20 },
  // The star prisms (star.ts) are no grid: their own module builds and turns them. These only bound their hexagonal model (q and r within +-1, the layers at y = +-1 and +-2).
  star: { label: '2-Star Prism (UFO)', slug: '2-star', dims: [3, 4, 3], scramble: 20, pad: 'star' },
  star4: { label: '4-Star Prism', slug: '4-star', dims: [3, 4, 3], scramble: 40, pad: 'star' },
} satisfies Record<string, PuzzleEntry>
