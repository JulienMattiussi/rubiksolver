import type { Block } from './bonds'

/** The 2x2x2 the Fused holds at its back down left corner (BPG). */
const FUSED: Block = ['DBL', 'DL', 'DB', 'BL', 'D', 'L', 'B', 'O']

/**
 * Each bandaged puzzle's blocks (bonds.ts), after fan2cube.fr's pictures,
 * in its frame (H white up, A green in front, D red on the right). Each was
 * checked against its page: every formula of its solution goes, and its
 * forms are as many as the page counts (tests/unit/puzzles/bandaged).
 */
export const BLOCKS = {
  // The Fused's 2x2x2, grown by its front: a 2x2x3 (fan2cube.fr/bigblock1).
  bigBlock: [[...FUSED, 'DFL', 'DF', 'FL', 'F']],
  // Its equator's left, front and back fused: F, FL, L, BL, B (squarebik1).
  squarebik: [['F', 'FL', 'L', 'BL', 'B']],
  // Three squares round the small cube at HDA (U F R), and three bars
  // (quadstripe1).
  quadStripe: [
    ['UFL', 'UL', 'FL', 'L'],
    ['UB', 'UBR', 'B', 'BR'],
    ['DF', 'DFR', 'D', 'DR'],
    ['DFL', 'DL'],
    ['DB', 'DRB'],
    ['BL', 'UBL'],
  ],
  // Bars AG and DA (on its front, then below its right), tabs A, D and G,
  // and P and B fused through their edge, the "∟" (detour1).
  detour: [
    ['FL', 'DFL'],
    ['DFR', 'DR'],
    ['F', 'DF'],
    ['R', 'BR'],
    ['L', 'BL'],
    ['B', 'DB', 'D'],
  ],
  // A 2x2x2 (fused1).
  fused: [FUSED],
  // Squares on G and D, tabs A (with its top edge) and B (diamond1).
  diamond: [
    ['DFL', 'DL', 'FL', 'L'],
    ['DFR', 'DR', 'FR', 'R'],
    ['UF', 'F'],
    ['D', 'DB'],
  ],
  // Seven bars, a lone corner (HDA), tabs H, A, G and D, and the double
  // tab "∟" of B and P (bandagecube1).
  bandage: [
    ['UBL', 'UB'],
    ['UFL', 'UF'],
    ['UBR', 'UR'],
    ['FL', 'DFL'],
    ['FR', 'DFR'],
    ['BL', 'DBL'],
    ['DR', 'DRB'],
    ['U', 'UL'],
    ['F', 'DF'],
    ['L', 'DL'],
    ['R', 'BR'],
    ['B', 'DB', 'D'],
  ],
  // The QuadStripe's squares, without its bars (quad1).
  quad: [
    ['UFL', 'UL', 'FL', 'L'],
    ['UB', 'UBR', 'B', 'BR'],
    ['DF', 'DFR', 'D', 'DR'],
  ],
  // Three bars in a Y round BDA (D R F): each edge there fused to its
  // other corner (stripe1).
  stripe: [
    ['DFL', 'DF'],
    ['UFR', 'FR'],
    ['DRB', 'DR'],
  ],
  // The 2x2x2, and three bars in a Y round HDA (fusedstripe1).
  fusedStripe: [FUSED, ['UFL', 'UF'], ['DFR', 'FR'], ['UBR', 'UR']],
  // The 2x2x2, bars AG, AD and PD down to their corners, tabs A and D down
  // to their edges, and a square of H at its back left (alcatraz1).
  alcatraz: [
    FUSED,
    ['FL', 'DFL'],
    ['FR', 'DFR'],
    ['BR', 'DRB'],
    ['F', 'DF'],
    ['R', 'DR'],
    ['U', 'UL', 'UB', 'UBL'],
  ],
} as const satisfies Record<string, readonly Block[]>
