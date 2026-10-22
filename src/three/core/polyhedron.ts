import { dot, cross } from '@/lib/core/geometry'
import type { Vec3 } from '@/lib/core/types'
import type { P3 } from './polygons'

/**
 * Convex polyhedra from their planes, for pieces cut out of a cell by a
 * solid (the Pyramorphinx's cells by a tetrahedron, the 4-Trajber's by an
 * octahedron).
 */

const EPSILON = 1e-9

/** A half-space `normal . p <= offset`, its normal pointing out of the piece. */
export interface Plane {
  readonly normal: Vec3
  readonly offset: number
}

/** The point where three planes meet, if they do at a single point. */
function meet(a: Plane, b: Plane, c: Plane): P3 | null {
  const bc = cross(b.normal, c.normal)
  const det = dot(a.normal, bc)
  if (Math.abs(det) < EPSILON) return null
  const ca = cross(c.normal, a.normal)
  const ab = cross(a.normal, b.normal)
  return [0, 1, 2].map(
    (d) => (a.offset * bc[d]! + b.offset * ca[d]! + c.offset * ab[d]!) / det,
  ) as P3
}

/** A convex polyhedron's faces from its planes: every corner where three
 *  planes meet inside all the others, each plane's corners in turn order. */
export function polyhedron(planes: readonly Plane[]): { corners: P3[]; normal: Vec3 }[] {
  const points: P3[] = []
  for (let i = 0; i < planes.length; i++)
    for (let j = i + 1; j < planes.length; j++)
      for (let k = j + 1; k < planes.length; k++) {
        const p = meet(planes[i]!, planes[j]!, planes[k]!)
        if (!p || planes.some((q) => dot(q.normal, p) > q.offset + 1e-7)) continue
        if (!points.some((o) => o.every((v, d) => Math.abs(v - p[d]!) < 1e-7))) points.push(p)
      }
  return planes.flatMap(({ normal, offset }) => {
    const on = points.filter((p) => Math.abs(dot(normal, p) - offset) < 1e-7)
    if (on.length < 3) return []
    const center = [0, 1, 2].map((d) => on.reduce((s, p) => s + p[d]!, 0) / on.length)
    // Two directions across the face, to sort its corners by angle.
    const u = on[0]!.map((v, d) => v - center[d]!)
    const w = cross(normal, u)
    const angle = (p: P3) => {
      const r = p.map((v, d) => v - center[d]!)
      return Math.atan2(dot(r, w), dot(r, u))
    }
    return [{ corners: [...on].sort((a, b) => angle(a) - angle(b)), normal }]
  })
}
