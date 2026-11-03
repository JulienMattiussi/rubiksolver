import type { CubeShape } from '@/lib/core/shapes'
import type { Cube } from '@/lib/core/types'
import { polyDrawing } from '@/three/core/polyDrawing'

/** Its width, in the drawing's units, and the outline's stroke. */
const SPAN = 4.4

/**
 * Pieces seen from straight above, as their drawing outlines them (a
 * Square-1's layer while its shape is entered in stages): each piece's face
 * turned up, plain, so that only the shape tells; the slash's cut as a
 * dashed line along the drawing's y axis, when asked.
 */
export function FromAbove({
  shape,
  pieces,
  cut = false,
  className,
}: {
  shape: CubeShape
  pieces: Cube
  cut?: boolean
  className?: string
}) {
  const drawing = polyDrawing(shape)
  const faces = pieces.flatMap((c) => drawing.polygons(c).filter((p) => p.normal[2] > 0.5))
  const half = SPAN / 2
  return (
    <svg viewBox={`${-half} ${-half} ${SPAN} ${SPAN}`} className={className} aria-hidden>
      {faces.map((p, i) => (
        <polygon
          key={i}
          // The drawing's y up, the picture's down.
          points={p.points.map(([x, y]) => `${x},${-y}`).join(' ')}
          className="fill-slate-300 stroke-slate-900"
          strokeWidth={0.06}
          strokeLinejoin="round"
        />
      ))}
      {cut && (
        <line
          x1={0}
          y1={-half}
          x2={0}
          y2={half}
          className="stroke-amber-400"
          strokeWidth={0.05}
          strokeDasharray="0.15 0.12"
        />
      )}
    </svg>
  )
}
