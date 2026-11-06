import type { P2 } from '../../core/plane'

/**
 * How a puzzle read by its outlines lies on its picture (pure): the map
 * from its model (y up) to the picture's pixels (y down). First an affine
 * map, fitted on its anchor's corners (least squares): a perspective
 * fitted on so few points so close together would blow a pixel's error
 * up far from them. Then, on its seams, found across the whole puzzle,
 * a perspective (a puzzle held tilted, its far side smaller).
 */

/** (x, y) to ((a x + b y + c) / w, (d x + e y + f) / w), w = g x + h y + i. */
export type PlaneMap = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export function apply([a, b, c, d, e, f, g, h, i]: PlaneMap, [x, y]: P2): P2 {
  const w = g * x + h * y + i
  return [(a * x + b * y + c) / w, (d * x + e * y + f) / w]
}

/** How many pixels a unit of the model spans round its origin. */
export function scaleOf([a, b, c, d, e, f, g, h, i]: PlaneMap): number {
  // The map's derivative at the origin.
  const [xx, xy] = [(a * i - c * g) / (i * i), (b * i - c * h) / (i * i)]
  const [yx, yy] = [(d * i - f * g) / (i * i), (e * i - f * h) / (i * i)]
  return Math.sqrt(Math.abs(xx * yy - xy * yx))
}

/** The unknowns that best solve `rows · v = rhs` (least squares, by its
 *  normal equations), none if they do not tell them. */
function leastSquares(rows: readonly number[][], rhs: readonly number[]): number[] | undefined {
  const n = rows[0]!.length
  const m = Array.from({ length: n }, (_, r) => {
    const line = Array.from({ length: n + 1 }, () => 0)
    rows.forEach((row, k) => {
      for (let c = 0; c < n; c++) line[c]! += row[r]! * row[c]!
      line[n]! += row[r]! * rhs[k]!
    })
    return line
  })
  // Gaussian elimination, the largest pivot first.
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++)
      if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r
    if (Math.abs(m[pivot]![col]!) < 1e-12) return undefined
    ;[m[col], m[pivot]] = [m[pivot]!, m[col]!]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const k = m[r]![col]! / m[col]![col]!
      for (let c = col; c <= n; c++) m[r]![c]! -= k * m[col]![c]!
    }
  }
  return m.map((line, r) => line[n]! / line[r]!)
}

/** How far a map leaves points from where they should go (root mean
 *  square, in pixels). */
const offOf = (map: PlaneMap, from: readonly P2[], to: readonly P2[]) =>
  Math.sqrt(
    from.reduce((s, p, k) => {
      const [u, v] = apply(map, p)
      return s + (u - to[k]![0]) ** 2 + (v - to[k]![1]) ** 2
    }, 0) / from.length,
  )

/** The affine map taking points to others as closely as it can, and how
 *  far off it leaves them. */
export function fitAffine(from: readonly P2[], to: readonly P2[]): { map: PlaneMap; off: number } {
  const rows = from.map(([x, y]) => [x, y, 1])
  const u = leastSquares(
    rows,
    to.map((p) => p[0]),
  )!
  const v = leastSquares(
    rows,
    to.map((p) => p[1]),
  )!
  const map: PlaneMap = [u[0]!, u[1]!, u[2]!, v[0]!, v[1]!, v[2]!, 0, 0, 1]
  return { map, off: offOf(map, from, to) }
}

/** The perspective taking points to others as closely as it can (the
 *  pixels taken round their middle, for a well-posed system), none if
 *  they do not tell one. */
export function fitPerspective(from: readonly P2[], to: readonly P2[]): PlaneMap | undefined {
  const [mx, my] = [
    to.reduce((s, p) => s + p[0], 0) / to.length,
    to.reduce((s, p) => s + p[1], 0) / to.length,
  ]
  const unit = Math.sqrt(
    to.reduce((s, p) => s + (p[0] - mx) ** 2 + (p[1] - my) ** 2, 0) / to.length,
  )
  const [rows, rhs]: [number[][], number[]] = [[], []]
  from.forEach(([x, y], k) => {
    const [u, v] = [(to[k]![0] - mx) / unit, (to[k]![1] - my) / unit]
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    rhs.push(u)
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    rhs.push(v)
  })
  const h = leastSquares(rows, rhs)
  if (!h) return undefined
  const [a, b, c, d, e, f, g, i] = h as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ]
  // Back to pixels: u' = unit u + mx.
  return [
    unit * a + mx * g,
    unit * b + mx * i,
    unit * c + mx,
    unit * d + my * g,
    unit * e + my * i,
    unit * f + my,
    g,
    i,
    1,
  ]
}

/** `a` after `b`. */
export function compose(a: PlaneMap, b: PlaneMap): PlaneMap {
  const row = (r: number, c: number) =>
    a[3 * r]! * b[c]! + a[3 * r + 1]! * b[3 + c]! + a[3 * r + 2]! * b[6 + c]!
  return [0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) =>
    row(Math.floor(k / 3), k % 3),
  ) as unknown as PlaneMap
}
