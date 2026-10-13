import { solvedCube } from '../cube'
import type { Cube, Cubie, Vec3 } from '../types'
import { centersDone } from './centers'
import { edgesPaired } from './edges'

/**
 * Projection of a reduced 6x6 onto a virtual 3x3, as for the 4x4
 * (solver4/project.ts): centers solved and edges paired, outer turns act on
 * the 6x6 exactly as on a 3x3. Each 3x3 piece is read on a 6x6 one: a
 * corner on the corner, an edge on an outer wing, a center on an outer "x".
 */

export function isReduced(cube: Cube): boolean {
  return centersDone(cube) && edgesPaired(cube)
}

const representative = (p: Vec3) => p.map((v) => (v === 0 ? 3 : 5 * v)).join(',')
const TEMPLATE_3 = solvedCube('3')

export function to3x3(cube6: Cube): Cube {
  if (!isReduced(cube6)) throw new Error('to3x3: cube is not reduced')
  const byPos = new Map(cube6.map((c) => [c.position.join(','), c]))
  return TEMPLATE_3.map((t): Cubie => {
    const source = byPos.get(representative(t.position))
    if (!source) throw new Error('to3x3: malformed 6x6 cube')
    return { position: t.position, stickers: source.stickers }
  })
}
