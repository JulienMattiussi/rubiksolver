import { DODECA_NORMALS } from '../../core/geometry'
import type { CubeShape } from '../../core/shapes'
import type { PuzzleModel } from '../model'
import { holeyScan } from '../holey/holeyScan'
import { dodecaScan } from './dodecaScan'
import { FTO_TURNS, scrambleFto, solvedFto } from './fto'
import {
  CRYSTAL_TURNS,
  MEGA_SYMMETRIES,
  MEGA_TURNS,
  scrambleMegaminx,
  solvedCrystal,
  solvedMegaminx,
} from './megaminx'
import { megaScan } from './megaminxScan'
import { solvedOct4 } from './oct4'
import { OCT_SCAN } from './octScan'
import { RAINBOW_TURNS, scrambleRainbow, solvedRainbow } from '../shared/rainbow'
import { scrambleSkewbU, SKEWB_SYMMETRIES, SKEWB_TURNS, solvedSkewbU } from '../shared/skewbs'
import { solvedGem, solvedVto } from './vto'
import { dinoGuide, ftoGuide, megaGuide, triangleGuide } from '../guides'

/** The Megaminx, as the Holey Megaminx turns too. */
export const MEGAMINX: PuzzleModel = {
  solved: solvedMegaminx,
  symmetries: MEGA_SYMMETRIES,
  turns: () => MEGA_TURNS,
  scramble: (length, rng) => scrambleMegaminx(length, rng),
  guide: () => megaGuide(false),
}

const SKEWB_U_SCAN = dodecaScan(solvedSkewbU(), DODECA_NORMALS[1]!, DODECA_NORMALS[0]!)

export const POLYHEDRON_MODELS = {
  // Scanned face by face, as an octahedron (octScan.ts).
  oct4: { solved: solvedOct4, scan: OCT_SCAN },
  vto: { solved: solvedVto, scan: OCT_SCAN },
  gem: { solved: solvedGem, scan: OCT_SCAN },
  fto: {
    solved: solvedFto,
    scan: OCT_SCAN,
    turns: () => FTO_TURNS,
    scramble: (length, rng) => scrambleFto(length, rng),
    guide: ftoGuide,
  },
  rainbow: {
    solved: solvedRainbow,
    // By its six squares, as a Skewb: each piece is told by its two square
    // colors, never turned in place, its triangles' colors with it.
    scan: 'square',
    turns: () => RAINBOW_TURNS,
    scramble: (length, rng) => scrambleRainbow(length, rng),
    guide: triangleGuide,
  },
  // Scanned face by face, each a ring round its center (megaminxScan.ts).
  megaminx: { ...MEGAMINX, scan: megaScan },
  crystal: {
    solved: solvedCrystal,
    // The Holey Megaminx's pieces, no center telling a face: shown by its
    // gestures (holeyScan.ts), its cuts drawn deep.
    scan: (behind) => holeyScan(behind).map((ring) => ({ ...ring, deep: true as const })),
    symmetries: MEGA_SYMMETRIES,
    turns: () => CRYSTAL_TURNS,
    scramble: (length, rng) => scrambleMegaminx(length, rng, true),
    guide: () => megaGuide(true),
  },
  skewbU: {
    solved: solvedSkewbU,
    // By its flat faces, three stickers each, as a dodecahedron.
    scan: SKEWB_U_SCAN,
    symmetries: SKEWB_SYMMETRIES,
    turns: () => SKEWB_TURNS,
    scramble: (length, rng) => scrambleSkewbU(length, rng),
    guide: () => dinoGuide({ skewb: true }),
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
