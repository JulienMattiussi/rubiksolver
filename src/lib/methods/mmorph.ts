import { isSolved, solvedCube } from '../cube'
import { AXIS_ROTATIONS, FACE_NORMAL, faceOfNormal } from '../geometry'
import { withoutCenterMarks } from '../mmorph'
import { invertMoves, parseMoves } from '../moves'
import { moveSet } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import type { Cube, Move } from '../types'

/**
 * The Master Morphinx (mmorph.ts) solved "style Rubik's Cube", as
 * fan2cube.fr teaches it (mastermorphinx2): a Super 3x3x3 in disguise. A
 * 3x3 method on its colors (the centers' marks set aside), then the
 * centers turned with the page's two formulas, from every way of holding
 * it: (H)+(G)- = Hd'h'd.H'd'hd and (H)2+ = (H.DGH²D'G')².
 */

/** (H)+(G)- */
export const CENTERS_TWO = "U 2R' 2U' 2R U' 2R' 2U 2R"
/** (H)2+ */
export const CENTER_HALF = "U R L U2 R' L' U R L U2 R' L'"

const CENTERS = solvedCube('3')
  .filter((c) => c.stickers.length === 1)
  .map((c) => c.position)

/** Each formula held every way, both ways. */
const TURNERS: Move[][] = [CENTERS_TWO, CENTER_HALF].flatMap((formula) =>
  AXIS_ROTATIONS.flatMap((turn) => {
    const moves = parseMoves(formula).map((m) => ({
      ...m,
      face: faceOfNormal(turn(FACE_NORMAL[m.face])),
    }))
    return [moves, invertMoves(moves)]
  }),
)

/** A 3x3 plan, played on the Master Morphinx: on its colors, then its
 *  centers. */
export function mmorphPlan(plan: MethodPlan): MethodPlan {
  return [
    ...plan.map((spec) => ({
      ...spec,
      goal: (cube: Cube) => spec.goal(withoutCenterMarks(cube)),
      phases: spec.phases.map((phase) => (cube: Cube) => phase(withoutCenterMarks(cube))),
    })),
    {
      key: 'stepMorphCenters',
      goal: isSolved,
      moves: moveSet('U D L R F B 2U 2D 2L 2R 2F 2B'),
      phases: [
        (cube) =>
          solvePieces(cube, { track: CENTERS, moves: moveSet(''), macros: TURNERS, maxDepth: 8 }),
      ],
    },
  ]
}
