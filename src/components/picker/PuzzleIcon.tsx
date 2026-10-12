import { isPolyDrawn, type Cube, type CubeShape, type CubeVariant } from '@/lib/types'
import { COLOR_HEX, MIRROR_STICKER, PLASTIC } from '@/three/colors'
import { formDrawing, isometricDrawing } from '@/three/isometric'
import { polyDrawing } from '@/three/polyDrawing'

/** A color darkened by `shade` (0 = as is, 1 = black). */
function darkened(hex: string, shade: number): string {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) * (1 - shade))
  return `rgb(${channels.map(Math.round).join(',')})`
}

/** Thumbnail of a solved puzzle, drawn in isometric view (decorative). Each
 *  polygon is outlined in its own color: adjacent ones (a curved face cut
 *  fine) leave no hairline between them. */
export function PuzzleIcon({
  shape,
  variant,
  form,
  className = '',
}: {
  shape: CubeShape
  variant: CubeVariant
  /** A form of a shape-shifting puzzle to draw instead of its box (forms.ts). */
  form?: Cube
  className?: string
}) {
  const { polygons, viewBox } = form ? formDrawing(shape, form) : isometricDrawing(shape, variant)
  // One color for every sticker on a mirror cube and on a puzzle drawn in one.
  const skin =
    variant === 'mirror' ? MIRROR_STICKER : isPolyDrawn(shape) ? polyDrawing(shape).skin : undefined
  const fill = (paint: (typeof polygons)[number]['paint']) =>
    paint === 'body' ? PLASTIC : (skin ?? COLOR_HEX[paint])
  return (
    <svg viewBox={viewBox} className={className} aria-hidden>
      {polygons.map((p, i) => {
        const color = darkened(fill(p.paint), p.shade)
        return (
          <polygon
            key={i}
            points={p.points}
            fill={color}
            stroke={color}
            strokeWidth={0.012}
            strokeLinejoin="round"
          />
        )
      })}
    </svg>
  )
}
