/**
 * Convex polygons in a plane (pure): cut, pulled in, a point tested. A
 * flat puzzle's pieces (the Floppy Ghost's), and their scan.
 */

export type P2 = readonly [number, number]

/** Keep the part of a convex polygon where `side(p) >= 0`. */
export function clip(polygon: readonly P2[], side: (p: P2) => number): P2[] {
  const out: P2[] = []
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!
    const [sa, sb] = [side(a), side(b)]
    if (sa >= 0) out.push(a)
    if (sa >= 0 !== sb >= 0) {
      const t = sa / (sa - sb)
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
    }
  })
  return out
}

/** The same convex polygon, each edge pulled in by `d`. */
export function inset(polygon: readonly P2[], d: number): P2[] {
  const n = polygon.length
  const lines = polygon.map((a, i) => {
    const b = polygon[(i + 1) % n]!
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
    const length = Math.hypot(dx, dy)
    // Counterclockwise: the inside is on the left.
    const normal: P2 = [-dy / length, dx / length]
    return { point: [a[0] + normal[0] * d, a[1] + normal[1] * d] as P2, dir: [dx, dy] as P2 }
  })
  return lines.map((line, i) => {
    const prev = lines[(i + n - 1) % n]!
    const cross = prev.dir[0] * line.dir[1] - prev.dir[1] * line.dir[0]
    const t =
      ((line.point[0] - prev.point[0]) * line.dir[1] -
        (line.point[1] - prev.point[1]) * line.dir[0]) /
      cross
    return [prev.point[0] + t * prev.dir[0], prev.point[1] + t * prev.dir[1]]
  })
}

/** Whether a point lies in a counterclockwise convex polygon. */
export function inside(polygon: readonly P2[], [x, y]: P2): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!
    const b = polygon[(i + 1) % polygon.length]!
    if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) < 0) return false
  }
  return true
}
