import { guessColor } from '@/lib/editor/scan/color'
import type { Rect } from '@/lib/editor/scan/frame'
import type { CellSample } from '@/lib/editor/scan/sample'
import { COLOR_HEX } from '@/three/core/colors'

interface ScanFrameProps {
  /** The frame on screen (frame.ts). */
  rect: Rect
  rows: number
  cols: number
  /** The cell that must show the face's center. */
  center: number
  /** The colors read hold: the face is about to be taken. */
  holding: boolean
  /** The cells as last read, row by row as the camera sees them. */
  cells: readonly CellSample[]
  /** The picture is shown mirrored (a camera facing the user). */
  mirrored: boolean
  /** Each cell's measure written in it, to tune the scan. */
  debug: boolean
}

/** The frame a face is aimed into: dashed, its grid faint, the cell of its
 *  center outlined; green while its colors hold. Each cell shows the color
 *  it seems to be, as a dot (a ring when not surely, nothing when it is no
 *  cube color), so one sees what holds the scan. */
export function ScanFrame(props: ScanFrameProps) {
  const { rect, rows, cols, center, holding, cells, mirrored, debug } = props
  const tone = holding ? 'border-emerald-400' : 'border-white/90'
  const cellW = rect.width / cols
  const cellH = rect.height / rows
  const box = (cell: number, inset: number) => {
    const col = cell % cols
    return {
      left: ((mirrored ? cols - 1 - col : col) + inset) * cellW,
      top: (Math.floor(cell / cols) + inset) * cellH,
      width: (1 - 2 * inset) * cellW,
      height: (1 - 2 * inset) * cellH,
    }
  }
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-lg border-2 border-dashed transition-colors ${tone}`}
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    >
      {Array.from({ length: cols - 1 }, (_, i) => (
        <div
          key={`c${i}`}
          className="absolute inset-y-0 border-l border-white/25"
          style={{ left: (i + 1) * cellW }}
        />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <div
          key={`r${i}`}
          className="absolute inset-x-0 border-t border-white/25"
          style={{ top: (i + 1) * cellH }}
        />
      ))}
      <div
        className={`absolute rounded-md border-2 transition-colors ${tone}`}
        style={box(center, 0.1)}
      />
      {cells.map((cell, i) => {
        const { color, sure } = guessColor(cell.lab)
        return (
          <div key={i} className="absolute flex items-center justify-center" style={box(i, 0)}>
            {color && (
              <span
                className="size-3 rounded-full ring-2 ring-black/60"
                style={
                  sure
                    ? { background: COLOR_HEX[color] }
                    : { boxShadow: `inset 0 0 0 3px ${COLOR_HEX[color]}` }
                }
              />
            )}
            {debug && <CellMeasure cell={cell} />}
          </div>
        )
      })}
    </div>
  )
}

/** A cell's lightness, chroma and hue. */
function CellMeasure({ cell }: { cell: CellSample }) {
  const [l, a, b] = cell.lab
  const hue = (Math.atan2(b, a) * 180) / Math.PI
  return (
    <span className="absolute bottom-0 font-mono text-[9px] leading-tight text-white [text-shadow:0_0_2px_black]">
      {Math.round(l)} {Math.round(Math.hypot(a, b))} {Math.round(hue < 0 ? hue + 360 : hue)}°
    </span>
  )
}
