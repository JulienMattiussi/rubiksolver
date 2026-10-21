import type { ScanFace } from '@/lib/editor/scan/plan'

/** An arrow along an ellipse round the cube, in degrees clockwise on screen
 *  (0: right, 90: down, in front of the cube), drawn in front from `from`
 *  to `to`, its arrowhead at `to`; behind it, dashed, a part it went round
 *  first (a half turn). */
interface Gesture {
  readonly cx: number
  readonly cy: number
  readonly rx: number
  readonly ry: number
  readonly from: number
  readonly to: number
  readonly behind?: readonly [number, number]
  readonly label: string
}

const GESTURES: Record<Exclude<ScanFace['move'], 'first'>, Gesture> = {
  // A quarter turn to the left, about the vertical: its front goes left.
  turn: { cx: 33, cy: 31, rx: 24, ry: 9, from: -10, to: 190, label: '90°' },
  // Its top toward the lens: over its front, from the top down.
  tilt: { cx: 32, cy: 27, rx: 11, ry: 24, from: -100, to: 105, label: '90°' },
  // A half turn about the vertical: round its back, then its front.
  flip: { cx: 33, cy: 31, rx: 24, ry: 9, from: -10, to: 190, behind: [190, 350], label: '180°' },
}

const rad = (deg: number) => (deg * Math.PI) / 180

const pointAt = (g: Gesture, deg: number) =>
  [g.cx + g.rx * Math.cos(rad(deg)), g.cy + g.ry * Math.sin(rad(deg))] as const

const arc = (g: Gesture, from: number, to: number) => {
  const [x0, y0] = pointAt(g, from)
  const [x1, y1] = pointAt(g, to)
  return `M${x0} ${y0} A${g.rx} ${g.ry} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

/** A filled arrowhead at the end of the arc, along its way. */
const head = (g: Gesture) => {
  const [x, y] = pointAt(g, g.to)
  const [tx, ty] = [-g.rx * Math.sin(rad(g.to)), g.ry * Math.cos(rad(g.to))]
  const length = Math.hypot(tx, ty)
  const [dx, dy] = [tx / length, ty / length]
  const tip = [x + 7 * dx, y + 7 * dy]
  const side = (s: number) => [x - dx - s * 5 * dy, y - dy + s * 5 * dx]
  return [tip, side(1), side(-1)].map((p) => p.join(',')).join(' ')
}

/** The way to turn the cube for a face (none for the first one), drawn
 *  above its instruction: the cube in relief, the arrow round it. */
export function ScanMoveArrow({ move }: { move: ScanFace['move'] }) {
  if (move === 'first') return null
  const g = GESTURES[move]
  const line = { fill: 'none', strokeWidth: 3, strokeLinecap: 'round' } as const
  return (
    <svg viewBox="0 0 64 56" className="mx-auto mb-1 block h-20 w-24 shrink-0" aria-hidden>
      {g.behind && (
        <path
          d={arc(g, ...g.behind)}
          {...line}
          strokeDasharray="4 4"
          className="stroke-amber-300/50"
        />
      )}
      <g className="stroke-white/70" strokeWidth={1} strokeLinejoin="round">
        <polygon points="22,20 28,14 48,14 42,20" className="fill-white/35" />
        <polygon points="42,20 48,14 48,34 42,40" className="fill-white/10" />
        <rect x="22" y="20" width="20" height="20" className="fill-white/20" />
      </g>
      <path d={arc(g, g.from, g.to)} {...line} className="stroke-amber-300" />
      <polygon points={head(g)} className="fill-amber-300" />
      <text x="1" y="8" className="fill-amber-200 text-[8px] font-bold">
        {g.label}
      </text>
    </svg>
  )
}
