import type { PuzzleEntry } from '../entry'

/** The odd ones: shape mods, an off-center core, one-way faces,
 *  lenticular tiles. In the picker's order. */
export const TWISTED = {
  // Meffert's Pocket Cube (meffertsPocket.ts) turns on a 5x5's outer slabs: its pieces sit within +-3, in half mini cubes about its off-center core.
  meffertsPocket: {
    label: "Meffert's Pocket Cube",
    slug: 'mefferts-pocket-cube',
    dims: [5, 5, 5],
    scramble: 25,
    shifts: true,
    // Each axis's two halves (U, R and F's beyond the core, a wide turn of
    // four layers out of five), then the thin layers by A (meffertsPocket.ts).
    pad: 'layers',
    padGroups: [
      {
        key: 'halves',
        layers: [
          { face: 'U', depth: 4, wide: true },
          { face: 'D' },
          { face: 'R', depth: 4, wide: true },
          { face: 'L' },
          { face: 'F', depth: 4, wide: true },
          { face: 'B' },
        ],
      },
      { key: 'byA', layers: [{ face: 'U' }, { face: 'R' }, { face: 'F' }] },
    ],
    // Tried on the real one (stickers on a black body), 2026-11-04.
    scanTried: true,
  },
  // The Z-Twist (twist.ts): a 3x3x3, shaped otherwise.
  twist: { label: 'Z-Twist', slug: 'z-twist', dims: [3, 3, 3], scramble: 20, editHint: 'twist' },
  // The Quarter Cube (quarter.ts): a 3x3x3, its faces turning by turns.
  quarter: {
    label: 'Quarter Cube',
    slug: 'quarter-cube',
    dims: [3, 3, 3],
    scramble: 30,
    editHint: 'quarter',
    scanUnseen: 'centerMarks',
  },
  // The Latch Cube (latch.ts): a 3x3x3, its faces turning the way their
  // arrows say.
  latch: { label: 'Latch Cube', slug: 'latch-cube', dims: [3, 3, 3], scramble: 30 },
  // The Rubik's Impossible (impossible.ts): a 3x3 of lenticular tiles,
  // two colors each by the angle, its centers' lines counting.
  impossible: {
    label: "Rubik's Impossible",
    slug: 'rubiks-impossible',
    dims: [3, 3, 3],
    scramble: 20,
    editHint: 'impossible',
  },
  // The Fashion-V (fashion.ts): a 3x3x5 squashed to a cube, turning like a
  // 5x5x5 (its pieces within +-2), its thin layers alone only when laid.
  fashion: {
    label: 'Fashion-V',
    slug: 'fashion-v',
    dims: [3, 5, 3],
    scramble: 30,
    shifts: true,
    inner: ['slice', 'wide'],
    // Its blocks (each side's column, each half), then its thin layers (H
    // and h, b and B), which only go when their half is laid (fashion.ts).
    pad: 'layers',
    padGroups: [
      {
        key: 'blocks',
        layers: (['U', 'D', 'L', 'R', 'F', 'B'] as const).map((face) => ({
          face,
          depth: 2,
          wide: true,
        })),
      },
      {
        key: 'thin',
        layers: [{ face: 'U' }, { face: 'U', depth: 2 }, { face: 'D', depth: 2 }, { face: 'D' }],
      },
    ],
  },
  // The Square-1 (square1.ts) turns as the Hockey Puck, its corners two
  // twelfths wide: no grid, its slots within +-8 in its plane, three layers.
  square1: {
    moves: 'sectors',
    label: 'Square-1',
    slug: 'square-1',
    dims: [17, 17, 3],
    scramble: 30,
    pad: 'sectors',
    shifts: true,
  },
} satisfies Record<string, PuzzleEntry>
