/**
 * Where a scanned face's cells are, in its frame (pure, no React): the
 * points read, how far round each, the outline and the lines drawn in
 * watermark, and the ways the face can be held turned. A cube's face is a
 * grid, a Megaminx's a ring round its center, a Skewb's a square whose
 * points its drawing places (plan.ts says which sticker each point is).
 */

export type Point = readonly [number, number]

/** Where a face's cells are, in its frame (`width` by `height` units, from
 *  its top left). */
export interface FaceLayout {
  readonly width: number
  readonly height: number
  /** Each cell's middle, where it is read. */
  readonly points: readonly Point[]
  /** How far round each point it is read, each way. */
  readonly reach: number
  /** The frame's outline, and its lines in watermark. */
  readonly outline: readonly Point[]
  readonly lines: readonly (readonly [Point, Point])[]
  /** Each way it can be held turned, the identity first: the cell each
   *  cell then reads (`turned[i] = cells[turn[i]]`). */
  readonly turns: readonly (readonly number[])[]
}

/** How far apart two points are. */
export const gap = (p: Point, q: Point): number => Math.hypot(p[0] - q[0], p[1] - q[1])

/** A grid of `rows` by `cols`, a unit a cell: read on the middle 40% of
 *  each cell (its borders may hold the plastic, or the next sticker when
 *  the cube is not exactly the frame's size). Square, it turns by
 *  quarters; else by halves only. */
export function gridLayout(rows: number, cols: number): FaceLayout {
  const points: Point[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) points.push([col + 0.5, row + 0.5])
  }
  const lines: [Point, Point][] = [
    ...Array.from({ length: cols - 1 }, (_, i): [Point, Point] => [
      [i + 1, 0],
      [i + 1, rows],
    ]),
    ...Array.from({ length: rows - 1 }, (_, i): [Point, Point] => [
      [0, i + 1],
      [cols, i + 1],
    ]),
  ]
  const ids = points.map((_, i) => i)
  // Row r of the picture turned a quarter is column r of this one, upward.
  const quarter = (from: readonly number[]) =>
    from.map((_, i) => from[(cols - 1 - (i % cols)) * cols + Math.floor(i / cols)]!)
  const half = [...ids].reverse()
  return {
    width: cols,
    height: rows,
    points,
    reach: 0.2,
    outline: [
      [0, 0],
      [cols, 0],
      [cols, rows],
      [0, rows],
    ],
    lines,
    turns: rows === cols ? [ids, quarter(ids), half, quarter(half)] : [ids, half],
  }
}

/** A regular polygon of `sides`, a flat side on top (or at the bottom,
 *  turned half round), round its center: the center, then the edges
 *  clockwise from that side, then the corners (the proportions of a
 *  Megaminx's face). It turns by a side at a time. */
export function ringLayout(sides: number, bottom = false): FaceLayout {
  const layout = flatTopRing(sides)
  if (!bottom) return layout
  const { width, height } = layout
  const half = ([x, y]: Point): Point => [width - x, height - y]
  return {
    ...layout,
    points: layout.points.map(half),
    outline: layout.outline.map(half),
    lines: layout.lines.map(([a, b]) => [half(a), half(b)] as const),
  }
}

function flatTopRing(sides: number): FaceLayout {
  const step = (2 * Math.PI) / sides
  // Clockwise from the top, y down; corners half a step on.
  const at = (k: number, r: number): Point => {
    const angle = Math.PI / 2 - k * step
    return [r * Math.cos(angle), -r * Math.sin(angle)]
  }
  const corner = (k: number) => at(k + 0.5, 1)
  const xs = Array.from({ length: sides }, (_, k) => corner(k)[0])
  const ys = Array.from({ length: sides }, (_, k) => corner(k)[1])
  const [left, top] = [Math.min(...xs), -Math.cos(step / 2)]
  const move = ([x, y]: Point): Point => [x - left, y - top]
  const ks = Array.from({ length: sides }, (_, k) => k)
  const points = [
    [0, 0] as Point,
    ...ks.map((k) => at(k, 0.58)),
    ...ks.map((k) => at(k + 0.5, 0.72)),
  ]
  // The cuts: each parallel to a side, through the center's pentagon,
  // across to the two sides beside it.
  const inner = (k: number) => at(k + 0.5, 0.42)
  // Where the line through p and q meets the one through a and b.
  const meet = (p: Point, q: Point, a: Point, b: Point): Point => {
    const [dx, dy, ex, ey] = [q[0] - p[0], q[1] - p[1], b[0] - a[0], b[1] - a[1]]
    const t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / (dx * ey - dy * ex)
    return [p[0] + t * dx, p[1] + t * dy]
  }
  const cut = (k: number): [Point, Point] => {
    const [p, q] = [inner(k - 1), inner(k)]
    return [meet(p, q, corner(k - 2), corner(k - 1)), meet(p, q, corner(k), corner(k + 1))]
  }
  const turn = (by: number) => [
    0,
    ...ks.map((k) => 1 + ((k + by) % sides)),
    ...ks.map((k) => 1 + sides + ((k + by) % sides)),
  ]
  return {
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
    points: points.map(move),
    reach: 0.07,
    outline: ks.map((k) => move(corner(k))),
    lines: ks.map((k) => cut(k).map(move) as [Point, Point]),
    turns: ks.map(turn),
  }
}

/** A square face 2 units wide (its middle at 1, 1), its stickers at
 *  `points`: each read short of its nearest neighbor; turned a quarter, the
 *  points go round (a face whose points do not, never held turned). */
export function squareLayout(points: readonly Point[]): FaceLayout {
  const closest = Math.min(...points.flatMap((p, i) => points.slice(i + 1).map((q) => gap(p, q))))
  const quarter = points.map(([x, y]) => points.findIndex((q) => gap(q, [2 - y, x]) < 1e-6))
  const ids = points.map((_, i) => i)
  const times = (k: number) =>
    ids.map((i) => Array.from({ length: k }).reduce<number>((j) => quarter[j]!, i))
  return {
    width: 2,
    height: 2,
    points,
    reach: 0.3 * closest,
    outline: [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ],
    lines: [],
    turns: quarter.includes(-1) ? [ids] : [ids, times(1), times(2), times(3)],
  }
}

/** A regular polygon of `sides` round its middle, its corners at radius 1,
 *  a corner on top (a side on top, `pointDown`): a polyhedron's flat face
 *  (a pyramid's triangle). */
export function polygonFrame(sides: number, pointDown = false) {
  const corners = Array.from({ length: sides }, (_, k): Point => {
    const angle = Math.PI / 2 - (2 * Math.PI * (k + (pointDown ? 0.5 : 0))) / sides
    return [Math.cos(angle), -Math.sin(angle)]
  })
  const [left, top] = [Math.min(...corners.map((c) => c[0])), Math.min(...corners.map((c) => c[1]))]
  const move = ([x, y]: Point): Point => [x - left, y - top]
  return {
    width: Math.max(...corners.map((c) => c[0])) - left,
    height: Math.max(...corners.map((c) => c[1])) - top,
    outline: corners.map(move),
    middle: move([0, 0]),
  }
}

/** How much to scale points (round a frame's middle, y up) so that they fit
 *  its convex outline, the farthest across each side `share` of the way to
 *  it: a face fills its frame side to side (a Tetraminx's, its corners cut,
 *  as well as a Pyraminx's). */
export function fitScale(
  points: readonly Point[],
  outline: readonly Point[],
  middle: Point,
  share = 1,
): number {
  let scale = Infinity
  outline.forEach((a, i) => {
    const b = outline[(i + 1) % outline.length]!
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    // The side's normal (y down), outward, and how far out it lies.
    let [nx, ny] = [(b[1] - a[1]) / length, (a[0] - b[0]) / length]
    let d = (a[0] - middle[0]) * nx + (a[1] - middle[1]) * ny
    if (d < 0) [nx, ny, d] = [-nx, -ny, -d]
    const out = Math.max(...points.map(([x, y]) => x * nx - y * ny))
    if (out > 0) scale = Math.min(scale, (share * d) / out)
  })
  return scale
}
