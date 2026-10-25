import type { Vec3 } from '@/lib/core/types'
import type { P3 } from '../../core/polygons'

/**
 * Drawing a curved piece on a face of the cube |x|, |y|, |z| <= 1 (the
 * Curvy Copters', the Ivy Cube's): where a point across a face stands.
 */

/** A face's normal and the two axes across it. */
export function faceAxes(normal: Vec3): { axis: number; a: number; b: number } {
  const axis = normal.findIndex((v) => v !== 0)
  const [a, b] = [0, 1, 2].filter((i) => i !== axis) as [number, number]
  return { axis, a, b }
}

/** A point of a face at (u, v) across it, lifted off it, in the scene
 *  (`scene` scene units a model unit). */
export function onFace(normal: Vec3, u: number, v: number, lift: number, scene: number): P3 {
  const { axis, a, b } = faceAxes(normal)
  const p = [0, 0, 0]
  p[axis] = normal[axis]! * (1 + lift)
  p[a] = u
  p[b] = v
  return p.map((x) => x * scene) as P3
}
