import { FACE_COLOR, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, faceOfNormal } from '../../core/geometry'
import { edgeFlipParity } from '../standard/solver4/parity'
import type { MethodPlan } from '../../solve/solverKit'
import type { Color, Cube } from '../../core/types'
import { TORI_PLAN } from './tori'

/**
 * Edge Only, "extended cross", as taught on fan2cube.fr (edgeonly2): solved
 * "comme un Void Cube en ignorant les sommets", which is the Tori's way
 * (tori.ts). Without centers it has no fixed colors: the solved puzzle
 * aimed at is the way of holding it nearest the state, among those its
 * edges can reach (their flips adding up as the held puzzle's do), and the
 * Edge Only is read as the Tori it would be with that holding's centers,
 * its colors renamed to the standard ones. The Tori's plan then solves it,
 * with the same turns.
 */

const SOLVED = solvedCube('edge')
const CENTERS = solvedCube('tori').filter((c) => c.stickers.length === 1)

/** The solved puzzle held every way. */
const HOLDINGS: Cube[] = AXIS_ROTATIONS.map((turn) =>
  SOLVED.map((c) => ({
    position: turn(c.position),
    stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
  })),
)

const look = (cube: Cube) =>
  new Set(
    cube.flatMap((c) =>
      c.stickers.map((s) => `${c.position.join()}:${s.normal.join()}:${s.color}`),
    ),
  )

/** The holding aimed at: one the state's flips can reach, with the most
 *  stickers already where it wants them. */
function target(cube: Cube): Cube {
  const flips = edgeFlipParity(cube)
  const seen = look(cube)
  let best: Cube | undefined
  let most = -1
  for (const held of HOLDINGS) {
    if (edgeFlipParity(held) !== flips) continue
    const right = [...look(held)].filter((s) => seen.has(s)).length
    if (right > most) [best, most] = [held, right]
  }
  return best!
}

/** The Tori the state is, held as its target: each color renamed to the
 *  standard one of the face it ends on, the centers added. */
function asTori(cube: Cube): Cube {
  const held = target(cube)
  const rename = new Map<Color, Color>()
  for (const c of held)
    for (const s of c.stickers) rename.set(s.color, FACE_COLOR[faceOfNormal(s.normal)])
  return [
    ...cube.map((c) => ({
      ...c,
      stickers: c.stickers.map((s) => ({ ...s, color: rename.get(s.color)! })),
    })),
    ...CENTERS,
  ]
}

export const EDGE_ONLY_PLAN: MethodPlan = TORI_PLAN.map((spec) => ({
  ...spec,
  goal: (cube) => spec.goal(asTori(cube)),
  phases: spec.phases.map((phase) => (cube: Cube) => phase(asTori(cube))),
}))
