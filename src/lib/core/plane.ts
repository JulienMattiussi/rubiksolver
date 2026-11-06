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

/** The same convex polygon, each edge pulled in by `d` (or edge i by
 *  `d(i)`): what lies that far inside every edge's line. An edge shorter
 *  than its neighbors pull in vanishes (meeting its neighbors' lines
 *  instead would cross them). */
export function inset(polygon: readonly P2[], d: number | ((i: number) => number)): P2[] {
  let out = [...polygon]
  polygon.forEach((a, i) => {
    const by = typeof d === 'number' ? d : d(i)
    const b = polygon[(i + 1) % polygon.length]!
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
    const length = Math.hypot(dx, dy)
    if (length < 1e-12) return
    // Counterclockwise: the inside is on the left.
    out = clip(out, (p) => ((p[1] - a[1]) * dx - (p[0] - a[0]) * dy) / length - by)
  })
  return out
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
