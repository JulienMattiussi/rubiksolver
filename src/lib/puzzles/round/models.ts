import type { CubeShape } from '../../core/types'
import { solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { asSeenThin, thinEdgesSolved, withRealThinEdges } from '../shared/thinEdges'
import { DINO_TURNS, scrambleDino } from '../shared/dinoRex'
import { solvedDinoCyl } from './dinoCyl'
import { PUCK_TURNS, puckSolved, scramblePuck, solvedPuck } from './puck'
import { solvedStar, STAR_SYMMETRIES } from './star'

export const ROUND_MODELS = {
  star: { solved: () => solvedStar('star'), symmetries: STAR_SYMMETRIES },
  star4: { solved: () => solvedStar('star4'), symmetries: STAR_SYMMETRIES },
  // Its pieces go by pairs of a color: its numbers say the order. Held one
  // way only (by its piece 12, which never moves).
  puck: {
    entry: { byPieces: true },
    solved: solvedPuck,
    isSolved: puckSolved,
    symmetries: [],
    turns: () => PUCK_TURNS,
    scramble: (length, rng) => scramblePuck(length, rng),
  },
  dinoCyl: {
    entry: { byPieces: true },
    solved: solvedDinoCyl,
    turns: () => DINO_TURNS,
    scramble: (length, rng) => scrambleDino(length, rng),
  },
  // A 3x3 cut otherwise, its hidden core left out (which tells it from the
  // 3x3); its middle edges show one color: their way round does not count.
  barrel: {
    solved: () => solvedCube('3').filter((c) => c.stickers.length > 0),
    isSolved: thinEdgesSolved,
    // Piece by piece, its middle edges the way round the editor offers, the
    // one making it reachable.
    entry: {
      byPieces: true,
      seen: (cube, held) => asSeenThin(held(cube)),
      built: (cube) => withRealThinEdges(cube),
    },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
