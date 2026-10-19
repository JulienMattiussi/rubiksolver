import type { PuzzleEntry } from '../entry'

/** The Gear Cubes. In the picker's order. */
export const GEAR = {
  // The Gear Cubes (gear.ts): a 3x3x3 whose edges are gears.
  gearCube: {
    moves: 'gear',
    label: 'Gear Cube',
    slug: 'gear-cube',
    dims: [3, 3, 3],
    scramble: 20,
    pad: 'gear',
    editHint: 'gearPlain',
  },
  // Violet in place of red, red in place of orange, dark green.
  gearU: {
    home: 'classic',
    moves: 'gear',
    coloredClips: true,
    label: 'Gear Cube Ultimate',
    slug: 'gear-cube-ultimate',
    dims: [3, 3, 3],
    scramble: 20,
    scheme: { F: 'E', R: 'V', L: 'R' },
    pad: 'gear',
    editHint: 'gear',
  },
  gearX: {
    moves: 'gear',
    coloredClips: true,
    label: 'Gear Cube Extreme',
    slug: 'gear-cube-extreme',
    dims: [3, 3, 3],
    scramble: 25,
    pad: 'gear',
    editHint: 'gear',
  },
} satisfies Record<string, PuzzleEntry>
