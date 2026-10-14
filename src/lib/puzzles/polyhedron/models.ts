import type { CubeShape } from '../../core/types'
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
import { solvedOct4 } from './oct4'
import {
  RAINBOW_TURNS,
  scrambleRainbow,
  scrambleSkewbU,
  SKEWB_SYMMETRIES,
  SKEWB_TURNS,
  solvedRainbow,
  solvedSkewbU,
} from '../shared/rainbow'
import { solvedGem, solvedVto } from './vto'

/** The Megaminx, as the Holey Megaminx turns too. */
export const MEGAMINX: PuzzleModel = {
  solved: solvedMegaminx,
  symmetries: MEGA_SYMMETRIES,
  turns: () => MEGA_TURNS,
  scramble: (length, rng) => scrambleMegaminx(length, rng),
}

export const POLYHEDRON_MODELS = {
  oct4: { solved: solvedOct4 },
  vto: { solved: solvedVto },
  gem: { solved: solvedGem },
  fto: {
    solved: solvedFto,
    turns: () => FTO_TURNS,
    scramble: (length, rng) => scrambleFto(length, rng),
  },
  rainbow: {
    solved: solvedRainbow,
    turns: () => RAINBOW_TURNS,
    scramble: (length, rng) => scrambleRainbow(length, rng),
  },
  megaminx: MEGAMINX,
  crystal: {
    solved: solvedCrystal,
    symmetries: MEGA_SYMMETRIES,
    turns: () => CRYSTAL_TURNS,
    scramble: (length, rng) => scrambleMegaminx(length, rng, true),
  },
  skewbU: {
    solved: solvedSkewbU,
    symmetries: SKEWB_SYMMETRIES,
    turns: () => SKEWB_TURNS,
    scramble: (length, rng) => scrambleSkewbU(length, rng),
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
