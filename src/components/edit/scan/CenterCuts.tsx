import type { Point } from '@/lib/editor/scan/layout'

/** How far a cut runs past the mark, in its longest side, and in how many
 *  steps it fades. */
const REACH = 1.6
const STEPS = 8

/** The one piece a face is framed by, as framed (its corners on screen, in
 *  order): a mirror cube's center, a Floppy Ghost's anchor; and its sides
 *  carried on both ways, the cuts the rest of the face leans on, fading out
 *  (only that piece is fixed, the rest comes as its pieces do). */
export function CenterCuts({ mark, stroke }: { mark: readonly Point[]; stroke: string }) {
  const sides = mark.map((a, i) => [a, mark[(i + 1) % mark.length]!] as const)
  const reach = REACH * Math.max(...sides.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1])))
  // From each corner, outward along each side through it.
  const rays = sides.flatMap(([a, b]): [Point, Point][] => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const [dx, dy] = [(b[0] - a[0]) / length, (b[1] - a[1]) / length]
    return [
      [b, [dx, dy]],
      [a, [-dx, -dy]],
    ]
  })
  return (
    <>
      <polygon
        points={mark.map((p) => p.join(',')).join(' ')}
        strokeWidth={2}
        strokeLinejoin="round"
        className={`transition-colors ${stroke}`}
      />
      <Rays rays={rays} reach={reach} stroke={stroke} />
    </>
  )
}

/** Where a 2x2 mirror's four stickers meet (`at`), its cuts drawn through
 *  it, fading out `reach` away each way. */
export function CrossCuts({ at, reach, stroke }: { at: Point; reach: number; stroke: string }) {
  const ways: Point[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  return <Rays rays={ways.map((way) => [at, way])} reach={reach} stroke={stroke} />
}

/** Lines from points along directions, fading out over `reach`. */
function Rays({
  rays,
  reach,
  stroke,
}: {
  rays: readonly (readonly [Point, Point])[]
  reach: number
  stroke: string
}) {
  return rays.flatMap(([[x, y], [dx, dy]], r) =>
    Array.from({ length: STEPS }, (_, i) => {
      const [a, b] = [(i / STEPS) * reach, ((i + 1) / STEPS) * reach]
      return (
        <line
          key={`${r}-${i}`}
          x1={x + dx * a}
          y1={y + dy * a}
          x2={x + dx * b}
          y2={y + dy * b}
          strokeWidth={2}
          strokeOpacity={1 - (i + 0.5) / STEPS}
          className={`transition-colors ${stroke}`}
        />
      )
    }),
  )
}
