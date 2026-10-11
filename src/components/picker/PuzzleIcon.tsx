import type { CubeShape, CubeVariant } from '@/lib/types'
import { COLOR_HEX, MIRROR_STICKER, PLASTIC } from '@/three/colors'
import { isometricDrawing } from '@/three/isometric'

/** Thumbnail of a solved puzzle, drawn in isometric view (decorative). */
export function PuzzleIcon({
  shape,
  variant,
  className = '',
}: {
  shape: CubeShape
  variant: CubeVariant
  className?: string
}) {
  const { polygons, viewBox } = isometricDrawing(shape, variant)
  const fill = (paint: (typeof polygons)[number]['paint']) =>
    paint === 'body' ? PLASTIC : variant === 'mirror' ? MIRROR_STICKER : COLOR_HEX[paint]
  return (
    <svg viewBox={viewBox} className={className} aria-hidden>
      {polygons.map((p, i) => (
        <g key={i}>
          <polygon points={p.points} fill={fill(p.paint)} />
          {p.shade > 0 && <polygon points={p.points} fill="#000" opacity={p.shade} />}
        </g>
      ))}
    </svg>
  )
}
