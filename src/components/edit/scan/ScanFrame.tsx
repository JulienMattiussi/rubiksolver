import { cssOf, guessColor } from '@/lib/editor/scan/color'
import type { Rect } from '@/lib/editor/scan/frame'
import type { Point, ScanFace } from '@/lib/editor/scan/plan'
import type { CellSample } from '@/lib/editor/scan/sample'
import { COLOR_HEX } from '@/three/core/colors'

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
}

/** The frame a face is aimed into: its outline dashed, its lines faint,
 *  its center's cell outlined (if it tells the face); green while its
 *  colors hold. Each cell shows what it reads, as a dot: the cube color it
 *  seems to be (a ring when not surely, nothing when none), or on a puzzle
 *  of many colors the color measured; so one sees what holds the scan. */
export function ScanFrame({ rect, face, holding, cells, mirrored, debug }: ScanFrameProps) {
  const unit = rect.width / face.width
  const at = ([x, y]: Point): Point => [(mirrored ? face.width - x : x) * unit, y * unit]
  const stroke = holding ? 'stroke-emerald-400' : 'stroke-white/90'
  const points = (ps: readonly Point[]) => ps.map((p) => at(p).join(',')).join(' ')
  const middle = face.center !== null ? face.points[face.center] : undefined
  const side = 4 * face.reach * unit
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
        <polygon
          points={points(face.outline)}
          strokeWidth={2}
          strokeDasharray="6 4"
          strokeLinejoin="round"
          className={`transition-colors ${stroke}`}
        />
        {middle && (
          <rect
            x={at(middle)[0] - side / 2}
            y={at(middle)[1] - side / 2}
            width={side}
            height={side}
            rx={6}
            strokeWidth={2}
            className={`transition-colors ${stroke}`}
          />
        )}
      </svg>
      {cells.map((cell, i) => {
        const point = face.points[i]
        if (!point) return null
        const [x, y] = at(point)
        return (
          <div
            key={i}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: x, top: y }}
          >
            <CellDot cell={cell} named={face.named} />
            {debug && <CellMeasure cell={cell} />}
          </div>
        )
      })}
    </div>
  )
}

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
