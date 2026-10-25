import type { ScanFace } from '@/lib/editor/scan/plan'

/** An arrow along an ellipse round the cube, `c` + cos(t) `a` + sin(t) `b`
 *  (t in degrees; `a` and `b` on screen, so it may lie in the depth of the
 *  drawing), drawn in front from `from` to `to` (either way round), its
 *  arrowhead at `to`; behind it, dashed, a part it went round first (a half
 *  turn). A camera facing the user (the picture mirrored) has them see the
 *  puzzle from behind: a turn about the vertical is drawn flipped, an arrow
 *  in the depth (`deep`, a tilt) goes the other way. */
interface Gesture {
  readonly c: Point
  readonly a: Point
  readonly b: Point
  readonly from: number
  readonly to: number
  readonly behind?: readonly [number, number]
  readonly deep?: boolean
}

type Point = readonly [number, number]

const GESTURES: Record<
  Exclude<ScanFace['move'], 'first' | 'upright' | 'anchored' | 'show'>,
  Gesture
> = {
  // A turn to the left, about the vertical: its front goes left.
  turn: { c: [33, 31], a: [24, 0], b: [0, 9], from: -10, to: 190 },
  // The same, round its bottom (which stays at the bottom).
  below: { c: [33, 39], a: [24, 0], b: [0, 9], from: -10, to: 190 },
  // Its top toward the lens: in its depth (`a` toward its back), from
  // its back over its top, then down its front.
  tilt: { c: [36, 25], a: [10, -10], b: [0, 19], from: 10, to: -170, deep: true },
  // A half turn about the vertical: round its back, then its front.
  flip: { c: [33, 31], a: [24, 0], b: [0, 9], from: -10, to: 190, behind: [190, 350] },
  // A pyramid turned left about its top point, a third of a turn.
  spin: { c: [33, 34], a: [24, 0], b: [0, 9], from: -10, to: 130 },
  // Its top point backward, its bottom coming to the lens: the tilt the
  // other way round.
  topple: { c: [36, 25], a: [10, -10], b: [0, 19], from: -170, to: 10, deep: true },
  // Turned upside down: a half turn toward the lens, round its top, then
  // under it (dashed, behind).
  upend: {
    c: [36, 25],
    a: [10, -10],
    b: [0, 19],
    from: 10,
    to: -170,
    deep: true,
    behind: [-170, -350],
  },
}

const rad = (deg: number) => (deg * Math.PI) / 180

const pointAt = ({ c, a, b }: Gesture, deg: number): Point => [
  c[0] + a[0] * Math.cos(rad(deg)) + b[0] * Math.sin(rad(deg)),
  c[1] + a[1] * Math.cos(rad(deg)) + b[1] * Math.sin(rad(deg)),
]

/** The ellipse from one angle to another, in short steps. */
const arc = (g: Gesture, from: number, to: number) => {
  const steps = Math.ceil(Math.abs(to - from) / 5)
  return Array.from({ length: steps + 1 }, (_, i) => pointAt(g, from + ((to - from) * i) / steps))
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`)
    .join(' ')
}

/** A filled arrowhead at the end of the arc, along its way. */
const head = (g: Gesture) => {
  const [x, y] = pointAt(g, g.to)
  const way = Math.sign(g.to - g.from)
  const [sin, cos] = [Math.sin(rad(g.to)), Math.cos(rad(g.to))]
  const [tx, ty] = [way * (g.b[0] * cos - g.a[0] * sin), way * (g.b[1] * cos - g.a[1] * sin)]
  const length = Math.hypot(tx, ty)
  const [dx, dy] = [tx / length, ty / length]
  const tip = [x + 7 * dx, y + 7 * dy]
  const side = (s: number) => [x - dx - s * 5 * dy, y - dy + s * 5 * dx]
  return [tip, side(1), side(-1)].map((p) => p.join(',')).join(' ')
}

/** The way to turn the puzzle for a face (none for the first one, nor one
 *  told by its colors alone), drawn above its instruction: a cube (or the
 *  solid it is: a pyramid, an octahedron, a dodecahedron) in relief, the arrow round it,
 *  how far it turns. */
export function ScanMoveArrow({
  face,
  mirrored = false,
}: {
  face: Pick<ScanFace, 'move' | 'angle' | 'solid'>
  /** The camera faces the user: the turn goes the other way round. */
  mirrored?: boolean
}) {
  const { move, angle } = face
  if (move === 'first' || move === 'upright' || move === 'anchored' || move === 'show') return null
  const drawn = GESTURES[move]
  const g = mirrored && drawn.deep ? { ...drawn, from: drawn.to, to: drawn.from } : drawn
  const line = {
    fill: 'none',
    strokeWidth: 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const
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
        {face.solid === 'pyramid' ? (
          <>
            <polygon points="35,12 22,40 38,44" className="fill-white/20" />
            <polygon points="35,12 38,44 48,34" className="fill-white/10" />
          </>
        ) : face.solid === 'octahedron' ? (
          <>
            <polygon points="35,10 22,28 35,32" className="fill-white/30" />
            <polygon points="35,10 35,32 48,28" className="fill-white/15" />
            <polygon points="22,28 35,32 35,48" className="fill-white/20" />
            <polygon points="35,32 48,28 35,48" className="fill-white/10" />
          </>
        ) : face.solid === 'dodecahedron' ? (
          <>
            <polygon points="27,16 41,16 48,26 35,24 22,26" className="fill-white/30" />
            <polygon points="22,26 35,24 48,26 44,40 26,40" className="fill-white/20" />
          </>
        ) : (
          <>
            <polygon points="22,20 28,14 48,14 42,20" className="fill-white/35" />
            <polygon points="42,20 48,14 48,34 42,40" className="fill-white/10" />
            <rect x="22" y="20" width="20" height="20" className="fill-white/20" />
          </>
        )}
      </g>
      <g transform={mirrored && !g.deep ? 'translate(66 0) scale(-1 1)' : undefined}>
        <path d={arc(g, g.from, g.to)} {...line} className="stroke-amber-300" />
        <polygon points={head(g)} className="fill-amber-300" />
      </g>
      {angle !== null && (
        <text x="1" y="8" className="fill-amber-200 text-[8px] font-bold">
          {angle}°
        </text>
      )}
    </svg>
  )
}
