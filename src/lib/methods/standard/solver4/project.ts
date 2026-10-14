import { solvedCube } from '../../../core/cube'
import { centersDone } from './centers'
import { edgesPaired } from './edges'
import type { Cube, Cubie, Vec3 } from '../../../core/types'

/**
 * Projection of a reduced 4x4 onto a virtual 3x3. Once centers are solved and
 * wings paired, outer turns act on composite pieces exactly like 3x3 turns on
 * a 3x3 (they never split a pair nor move a center off its face), so the
 * projection is a homomorphism: solving the virtual cube with the existing
 * 3x3 phases and replaying the very same moves solves the 4x4.
 */

export function isReduced(cube: Cube): boolean {
  return centersDone(cube) && edgesPaired(cube)
}

/**
 * Representative 4x4 cubie of each virtual 3x3 cubie: outer coordinates map
 * to the matching outer layer, the free coordinates of edges/centers/core to
 * the +1 inner layer. The representative carries exactly the right stickers
 * (a wing for an edge, one facelet for a center, nothing for the core).
 */
function representative(p: Vec3): Vec3 {
  return [p[0] === 0 ? 1 : 3 * p[0], p[1] === 0 ? 1 : 3 * p[1], p[2] === 0 ? 1 : 3 * p[2]]
}

const TEMPLATE_3 = solvedCube('3')

export function to3x3(cube4: Cube): Cube {
  if (!isReduced(cube4)) throw new Error('to3x3: cube is not reduced')
  const byPos = new Map(cube4.map((c) => [c.position.join(','), c]))
  return TEMPLATE_3.map((t): Cubie => {
    const source = byPos.get(representative(t.position).join(','))
    if (!source) throw new Error('to3x3: malformed 4x4 cube')
    return { position: t.position, stickers: source.stickers }
  })
}
