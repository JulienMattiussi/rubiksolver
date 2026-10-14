import { FACE_COLOR } from '../../../core/cube'
import { faceOfNormal } from '../../../core/geometry'
import { allTurnsOf, type MoveSet } from '../../../core/moveSet'
import { applyMoves } from '../../../core/turn'
import type { Cube, Move } from '../../../core/types'
import { isFixedCenter } from './kinds'
import { projectPlan } from '../solver4/steps'
import type { MethodPlan } from '../../../solve/solverKit'
import { centersDone, solveCenters } from './centers'
import { MIDDLES } from '../../../solve/cycleLibrary'
import { fixEdgeParity, pairEdges, pairedOrParity } from './edges'
import { isReduced, to3x3 } from './project'

/**
 * 5x5 reduction methods, like the 4x4's (solver4/steps.ts): the centers,
 * the edges paired, the edge parity when the last edge comes out crossed,
 * then the given 3x3 plan through the projection. Only the edge parity
 * exists here: a reduced 5x5's corners and middle pieces are those of a
 * real 3x3, so its projection is always a legal 3x3.
 */

const ALL_5 = allTurnsOf('5')

/** Every turn, the middle slices too (the cross centers' commutators). */
const WITH_MIDDLES: MoveSet = {
  generators: [...ALL_5.generators, ...MIDDLES],
  turns: [...ALL_5.turns, ...MIDDLES],
}

/** The middle centers where the absolute frame wants them (the 3x3 plans
 *  take it: yellow down, white up). */
const middlesHome = (cube: Cube) =>
  cube
    .filter(isFixedCenter)
    .every((c) => c.stickers[0]!.color === FACE_COLOR[faceOfNormal(c.stickers[0]!.normal)])

/** The fewest middle slices putting them there (the puzzle held another
 *  way: the 3x3's M, E, S; 24 ways at most). */
function recenter(cube: Cube): Move[] {
  let frontier: { cube: Cube; moves: Move[] }[] = [{ cube: cube.filter(isFixedCenter), moves: [] }]
  const seen = new Set<string>()
  for (let depth = 0; depth < 4; depth++) {
    for (const node of frontier) if (middlesHome(node.cube)) return node.moves
    const next: typeof frontier = []
    for (const node of frontier) {
      for (const move of MIDDLES) {
        const moved = applyMoves(node.cube, [move], [5, 5, 5])
        const id = moved.map((c) => c.position.join() + c.stickers[0]!.color).join('|')
        if (seen.has(id)) continue
        seen.add(id)
        next.push({ cube: moved, moves: [...node.moves, move] })
      }
    }
    frontier = next
  }
  throw new Error('reduction5: the middle centers cannot go home')
}

export function reduction5Plan(plan3x3: MethodPlan): MethodPlan {
  return [
    {
      key: 'stepRecenter',
      goal: middlesHome,
      moves: WITH_MIDDLES,
      phases: [recenter],
      optional: true,
    },
    { key: 'stepCenters', goal: centersDone, moves: WITH_MIDDLES, phases: [solveCenters] },
    { key: 'stepPairEdges', goal: pairedOrParity, moves: ALL_5, phases: [pairEdges] },
    {
      key: 'stepParity',
      goal: isReduced,
      moves: ALL_5,
      phases: [fixEdgeParity],
      optional: true,
    },
    ...projectPlan(plan3x3, to3x3),
  ]
}
