import { solvedCube } from '../../../core/cube'
import type { Cube, Cubie } from '../../../core/types'
import { centersDone } from './centers'
import { edgesPaired } from './edges'

/**
 * Projection of a reduced 5x5 onto a virtual 3x3, as for the 4x4
 * (solver4/project.ts): centers solved and edges paired, outer turns move
 * whole edges and keep the centers, so they act on the 5x5 exactly as on a
 * 3x3. Each 3x3 piece is read on its 5x5 counterpart at twice its
 * coordinates: a corner on the corner, an edge on its middle piece, a
 * center on the fixed one.
 */

export function isReduced(cube: Cube): boolean {
  return centersDone(cube) && edgesPaired(cube)
}

const TEMPLATE_3 = solvedCube('3')

export function to3x3(cube5: Cube): Cube {
  if (!isReduced(cube5)) throw new Error('to3x3: cube is not reduced')
  const byPos = new Map(cube5.map((c) => [c.position.join(','), c]))
  return TEMPLATE_3.map((t): Cubie => {
    const source = byPos.get(t.position.map((v) => 2 * v).join(','))
    if (!source) throw new Error('to3x3: malformed 5x5 cube')
    return { position: t.position, stickers: source.stickers }
  })
}
