import { FACE_NORMAL, vecKey } from '../../core/geometry'
import { parseMoves } from '../../core/notation'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Face, Move } from '../../core/types'
import {
  centersAtHome,
  middlesStraight,
  middleTurns,
  nextCenterCycle,
  O_CORNER,
  O_EDGE,
  TURN_HALF,
  TURN_PAIR,
} from '../../methods/standard/superCube'
import { isFixedCenter } from '../../methods/standard/solver5/kinds'
import { withoutBorders } from '../../puzzles/standard/superCube'
import { projectedStages, tutorialOf, type FigureStage, type TutorialPlan } from '../../teach/kit'
import { samePieces } from '../../teach/project'
import { CUBE4_PLAN } from './cube4'
import { CUBE5_PLAN } from './cube5'
import { BORDER } from './termsBig'

/**
 * The Super Revenge's and the Super Professor's tutorials: the 4x4's and
 * the 5x5's played on their colors, the centers' borders set aside (a
 * projection keeping every piece where it stands), then the centers each
 * to its own place, as the solver does (superCube.ts): the Professor's
 * middle ones turned straight first, a formula at a time, then a 3-cycle
 * at a time (the page's O). With the colors done, the centers of a face
 * only stand among themselves.
 */

const BORDERLESS = samePieces(withoutBorders)

/** A piece by where it stands (its stickers do not say it: a center has
 *  its borders): on one face a center, two an edge, three a corner. */
const pieceKind = (cubie: Cubie) => {
  const reach = Math.max(...cubie.position.map(Math.abs))
  const faces = cubie.position.filter((v) => Math.abs(v) === reach).length
  return faces === 1 ? 'center' : faces === 2 ? 'edge' : 'corner'
}

const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' }
/** A middle slice named as the pad names it (by R, U or F): the page's
 *  formulas, held every way, also turn it from L, D or B. */
const padNamed = (moves: readonly Move[]): Move[] =>
  moves.map((m) =>
    m.depth === 3 && !m.wide && ['L', 'D', 'B'].includes(m.face)
      ? { ...m, face: OPPOSITE[m.face], amount: (4 - m.amount) as 1 | 2 | 3 }
      : m,
  )

/** The centers a formula moves (the cycle's three). */
const movedCenters = (cube: Cube, moves: readonly Move[]) => {
  const after = applyMoves(cube, moves)
  return cube.flatMap((c, i) =>
    pieceKind(c) === 'center' && vecKey(c.position) !== vecKey(after[i]!.position) ? [i] : [],
  )
}

/** The centers each to its place, a 3-cycle a step, as stage `stage`. */
function centersStage(name: 'super4' | 'super5', stage: number): FigureStage {
  const next = (cube: Cube) => {
    const cycle = nextCenterCycle(name, cube)
    return cycle && padNamed(cycle)
  }
  return {
    kind: 'figures',
    key: 'stepTutorialSuperCenters',
    stage,
    done: (cube) => nextCenterCycle(name, cube) === null,
    figures: [
      {
        key: 'figureSuperCenter',
        match: (cube) => {
          const moves = next(cube)
          return moves && { hold: 'F', moves }
        },
      },
    ],
    focus: (cube) => {
      const moves = next(cube)
      return moves ? movedCenters(cube, moves) : []
    },
    progress: (cube) => centersAtHome(name, cube),
    algorithms: (name === 'super4' ? [O_CORNER] : [O_CORNER, O_EDGE]).map((f) => [parseMoves(f)]),
  }
}

/** The Professor's middle centers turned straight, a formula a step. */
const MIDDLES_STAGE: FigureStage = {
  kind: 'figures',
  key: 'stepTutorialSuperMiddles',
  stage: 11,
  side: FACE_NORMAL.U,
  done: (cube) => middlesStraight(cube) === 6,
  figures: [
    {
      key: 'figureSuperMiddles',
      match: (cube) => {
        const [first] = middleTurns(cube)
        return first ? { hold: 'F', moves: padNamed(first) } : null
      },
    },
  ],
  focus: (cube) => cube.flatMap((c, i) => (isFixedCenter(c) ? [i] : [])),
  progress: (cube) => ({ done: middlesStraight(cube), total: 6 }),
  algorithms: [[padNamed(TURN_PAIR)], [TURN_HALF]],
}

/** A big cube's plan on its super cube, the stages after it its own. */
const onSuper = (plan: TutorialPlan, after: readonly FigureStage[]): TutorialPlan => ({
  ...plan,
  glossary: [...(plan.glossary ?? []), BORDER],
  pieceKind,
  // A center named by its own color (its borders say where it goes; alone,
  // its outer layer is where it stands).
  outside: (cubie) => withoutBorders([cubie])[0]!.stickers,
  stages: [...projectedStages(plan.stages, BORDERLESS), ...after],
})

export const SUPER4_TUTORIAL = tutorialOf(onSuper(CUBE4_PLAN, [centersStage('super4', 12)]))
export const SUPER5_TUTORIAL = tutorialOf(
  onSuper(CUBE5_PLAN, [MIDDLES_STAGE, centersStage('super5', 12)]),
)
