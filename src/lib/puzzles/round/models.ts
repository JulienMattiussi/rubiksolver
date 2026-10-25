import type { CubeShape, StarShape } from '../../core/shapes'
import { dinoGuide, puckGuide, starGuide } from '../guides'
import { solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { BY_PIECES } from '../../editor/entry'
import { asSeenThin, thinEdgesSolved, withRealThinEdges } from '../shared/thinEdges'
import { DINO_TURNS, scrambleDino } from '../shared/dinoRex'
import { solvedDinoCyl } from './dinoCyl'
import { PUCK_TURNS, puckSolved, scramblePuck, solvedPuck } from './puck'
import { starScan } from './starScan'
import { hiddenStarSticker, scrambleStar, solvedStar, STAR_SYMMETRIES, starTurnsOf } from './star'

/** A star prism: its rings and slash. */
const star = (shape: StarShape): PuzzleModel => ({
  solved: () => solvedStar(shape),
  symmetries: STAR_SYMMETRIES,
  turns: () => starTurnsOf(shape),
  scramble: (length, rng) => scrambleStar(shape, length, rng),
  guide: () => starGuide(shape),
  entry: { hidden: hiddenStarSticker },
  // By its sides, its top and its bottom (starScan.ts).
  scan: starScan(shape),
})

export const ROUND_MODELS = {
  star: star('star'),
  star4: star('star4'),
  // Its pieces go by pairs of a color: its numbers say the order. Held one
  // way only (by its piece 12, which never moves).
  puck: {
    entry: { paint: BY_PIECES },
    solved: solvedPuck,
    isSolved: puckSolved,
    symmetries: [],
    turns: () => PUCK_TURNS,
    scramble: (length, rng) => scramblePuck(length, rng),
    guide: puckGuide,
  },
  dinoCyl: {
    entry: { paint: BY_PIECES },
    solved: solvedDinoCyl,
    turns: () => DINO_TURNS,
    scramble: (length, rng) => scrambleDino(length, rng),
    guide: () => dinoGuide(),
  },
  // A 3x3 cut otherwise, its hidden core left out (which tells it from the
  // 3x3); its middle edges show one color: their way round does not count.
  barrel: {
    solved: () => solvedCube('3').filter((c) => c.stickers.length > 0),
    scan: 'grid',
    isSolved: thinEdgesSolved,
    // Piece by piece, its middle edges the way round the editor offers, the
    // one making it reachable.
    entry: {
      paint: BY_PIECES,
      seen: (cube, held) => asSeenThin(held(cube)),
      built: (cube) => withRealThinEdges(cube),
    },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
