import { cssOf, guessColor } from '@/lib/editor/scan/color'
import type { Rect } from '@/lib/editor/scan/frame'
import type { Point } from '@/lib/editor/scan/layout'
import type { ScanFace } from '@/lib/editor/scan/plan'
import type { CellSample } from '@/lib/editor/scan/sample'
import { COLOR_HEX } from '@/three/core/colors'
import { CenterCuts } from './CenterCuts'

interface ScanFrameProps {
  /** The frame on screen (frame.ts). */
  rect: Rect
  face: ScanFace
  /** The colors read hold: the face is about to be taken. */
  holding: boolean
  /** The cells as last read, as the camera sees them. */
  cells: readonly CellSample[]
  /** The picture is shown mirrored (a camera facing the user). */
  mirrored: boolean
  /** Each cell's measure written in it, to tune the scan. */
  debug: boolean
  /** The cells the puzzle's core goes in (a tower's middle four), marked:
   *  where they stand sets where every other cell does. */
  core?: readonly number[]
}

/** The frame a face is aimed into: its outline dashed, its lines faint,
 *  its center's cell outlined (if it tells the face), or its core's cells;
 *  a mirror's, or one read whole (which shows no dots), the piece it is
 *  framed by and the cuts from it, no outline;
 *  green while its
 *  colors hold. Each cell shows what it reads, as a dot: the cube color it
 *  seems to be (a ring when not surely, nothing when none), or on a puzzle
 *  of many colors, or out of shape (a wall looks like a white sticker),
 *  the color measured; so one sees what holds the scan. */
export function ScanFrame({ rect, face, holding, cells, mirrored, debug, core }: ScanFrameProps) {
  const unit = rect.width / face.width
  const at = ([x, y]: Point): Point => [(mirrored ? face.width - x : x) * unit, y * unit]
  const stroke = holding ? 'stroke-emerald-400' : 'stroke-white/90'
  const points = (ps: readonly Point[]) => ps.map((p) => at(p).join(',')).join(' ')
  // A face read by halves: its center fills the middle four sub-cells.
  const middle = (face.width / 2 - 1) * face.width + face.width / 2 - 1
  const centers = face.halves
    ? [middle, middle + 1, middle + face.width, middle + face.width + 1]
    : face.center !== null
      ? [face.center]
      : (core ?? [])
  const marked = centers.flatMap((i) => {
    const point = face.points[i]
    return point ? [at(point)] : []
  })
  const half = 2 * face.reach * unit
  const span = (axis: 0 | 1) => {
    const from = Math.min(...marked.map((p) => p[axis])) - half
    return [from, Math.max(...marked.map((p) => p[axis])) + half - from] as const
  }
  // A center on a face that is no rectangle (a Megaminx's pentagon): marked
  // in the face's shape, as wide as halfway to the stickers round it.
  const shaped =
    face.center !== null && face.outline.length !== 4
      ? centerShape(face.outline, face.points, face.center).map(at)
      : null
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    >
      <svg className="absolute inset-0 size-full overflow-visible" fill="none">
        {face.lines.map(([a, b], i) => (
          <line
            key={i}
            x1={at(a)[0]}
            y1={at(a)[1]}
            x2={at(b)[0]}
            y2={at(b)[1]}
            className="stroke-white/25"
          />
        ))}
        {/* A mirror's face: no outline (only its center is fixed), its
            center and the cuts from it; a face framed as a mirror's, and
            one read whole (its anchor and the cuts from it), alike. */}
        {face.mark ? (
          <CenterCuts mark={face.mark.map(at)} stroke={stroke} />
        ) : (
          <polygon
            points={points(face.outline)}
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeLinejoin="round"
            className={`transition-colors ${stroke}`}
          />
        )}
        {shaped ? (
          <polygon
            points={shaped.map((p) => p.join(',')).join(' ')}
            strokeWidth={2}
            strokeLinejoin="round"
            className={`transition-colors ${stroke}`}
          />
        ) : (
          marked.length > 0 && (
            <rect
              x={span(0)[0]}
              y={span(1)[0]}
              width={span(0)[1]}
              height={span(1)[1]}
              rx={6}
              strokeWidth={2}
              className={`transition-colors ${stroke}`}
            />
          )
        )}
      </svg>
      {!face.whole &&
        !face.sized &&
        cells.map((cell, i) => {
          const point = face.points[i]
          if (!point) return null
          const [x, y] = at(point)
          return (
            <div
              key={i}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: x, top: y }}
            >
              <CellDot cell={cell} named={face.named && !face.open} />
              {debug && <CellMeasure cell={cell} />}
            </div>
          )
        })}
    </div>
  )
}

/** The face's outline shrunk round its center's cell: its inradius the
 *  share of the gap to the nearest other cell. */
function centerShape(outline: readonly Point[], points: readonly Point[], center: number) {
  const [cx, cy] = points[center]!
  const middle = outline.reduce<Point>(
    (m, p) => [m[0] + p[0] / outline.length, m[1] + p[1] / outline.length],
    [0, 0],
  )
  const inradius = Math.min(
    ...outline.map((a, i) => {
      const b = outline[(i + 1) % outline.length]!
      const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
      return Math.abs((middle[0] - a[0]) * dy - (middle[1] - a[1]) * dx) / Math.hypot(dx, dy)
    }),
  )
  const nearest = Math.min(
    ...points.flatMap((p, i) => (i === center ? [] : [Math.hypot(p[0] - cx, p[1] - cy)])),
  )
  const scale = (CENTER_SHARE * nearest) / inradius
  return outline.map(([x, y]): Point => [
    cx + (x - middle[0]) * scale,
    cy + (y - middle[1]) * scale,
  ])
}

const CENTER_SHARE = 0.55

/** A cell's dot: its guessed color, filled when sure; or its measure. */
function CellDot({ cell, named }: { cell: CellSample; named: boolean }) {
  if (!named) {
    return (
      <span
        className="size-3 rounded-full ring-2 ring-black/60"
        style={{ background: cssOf(cell.lab) }}
      />
    )
  }
  const { color, sure } = guessColor(cell.lab)
  if (!color) return null
  return (
    <span
      className="size-3 rounded-full ring-2 ring-black/60"
      style={
        sure
          ? { background: COLOR_HEX[color] }
          : { boxShadow: `inset 0 0 0 3px ${COLOR_HEX[color]}` }
      }
    />
  )
}

/** A cell's lightness, chroma and hue. */
function CellMeasure({ cell }: { cell: CellSample }) {
  const [l, a, b] = cell.lab
  const hue = (Math.atan2(b, a) * 180) / Math.PI
  return (
    <span className="mt-1 whitespace-nowrap font-mono text-[9px] leading-tight text-white [text-shadow:0_0_2px_black]">
      {Math.round(l)} {Math.round(Math.hypot(a, b))} {Math.round(hue < 0 ? hue + 360 : hue)}°
    </span>
  )
}
