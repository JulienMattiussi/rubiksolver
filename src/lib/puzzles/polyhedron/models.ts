import type { CubeShape } from '../../core/shapes'
import type { PuzzleModel } from '../model'
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

export const POLYHEDRON_MODELS = {
  oct4: { solved: solvedOct4 },
  vto: { solved: solvedVto },
  gem: { solved: solvedGem },
  fto: {
    solved: solvedFto,
    turns: () => FTO_TURNS,
    scramble: (length, rng) => scrambleFto(length, rng),
    guide: ftoGuide,
  },
  rainbow: {
    solved: solvedRainbow,
    turns: () => RAINBOW_TURNS,
    scramble: (length, rng) => scrambleRainbow(length, rng),
    guide: triangleGuide,
  },
  // Scanned face by face, each a ring round its center (megaminxScan.ts).
  megaminx: { ...MEGAMINX, scan: megaScan },
  crystal: {
    solved: solvedCrystal,
    symmetries: MEGA_SYMMETRIES,
    turns: () => CRYSTAL_TURNS,
    scramble: (length, rng) => scrambleMegaminx(length, rng, true),
    guide: () => megaGuide(true),
  },
  skewbU: {
    solved: solvedSkewbU,
    symmetries: SKEWB_SYMMETRIES,
    turns: () => SKEWB_TURNS,
    scramble: (length, rng) => scrambleSkewbU(length, rng),
    guide: () => dinoGuide({ skewb: true }),
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
