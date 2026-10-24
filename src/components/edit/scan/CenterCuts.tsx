import type { Point } from '@/lib/editor/scan/layout'

/** How far a cut runs past the center, in its sides, and in how many
 *  steps it fades. */
const REACH = 1.6
const STEPS = 8

/** A mirror cube's center, as framed (its corners on screen), and its four
 *  sides carried on: the cuts its other stickers lean on, fading out (only
 *  the center is fixed, the rest of the face comes as its pieces do). */
export function CenterCuts({ square, stroke }: { square: readonly Point[]; stroke: string }) {
  const xs = square.map((p) => p[0])
  const ys = square.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const reach = REACH * (x1 - x0)
  // From each corner, outward along both sides through it.
  const rays: [Point, Point][] = [
    [
      [x0, y0],
      [-1, 0],
    ],
    [
      [x0, y1],
      [-1, 0],
    ],
    [
      [x1, y0],
      [1, 0],
    ],
    [
      [x1, y1],
      [1, 0],
    ],
    [
      [x0, y0],
      [0, -1],
    ],
    [
      [x1, y0],
      [0, -1],
    ],
    [
      [x0, y1],
      [0, 1],
    ],
    [
      [x1, y1],
      [0, 1],
    ],
  ]
  return (
    <>
      <rect
        x={x0}
        y={y0}
        width={x1 - x0}
        height={y1 - y0}
        strokeWidth={2}
        className={`transition-colors ${stroke}`}
      />
      {rays.flatMap(([[x, y], [dx, dy]], r) =>
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
      )}
    </>
  )
}
