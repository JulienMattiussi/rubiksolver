import { type Cube } from '@/lib/core/types'
import { type CubeShape, type CubeVariant } from '@/lib/core/shapes'
import { COLOR_HEX, VARIANT_SKIN, PLASTIC } from '@/three/core/colors'
import { formDrawing, isometricDrawing, pieceDrawing } from '@/three/core/isometric'
import { isPolyDrawn, polyDrawing } from '@/three/core/polyDrawing'

/** A color darkened by `shade` (0 = as is, 1 = black). */
function darkened(hex: string, shade: number): string {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) * (1 - shade))
  return `rgb(${channels.map(Math.round).join(',')})`
}

/** Thumbnail of a solved puzzle (or one of its pieces), drawn in isometric
 *  view (decorative). Each polygon is outlined in its own color: adjacent
 *  ones (a curved face cut fine) leave no hairline between them. */
export function PuzzleIcon({
  shape,
  variant,
  form,
  piece,
  className = '',
}: {
  shape: CubeShape
  variant: CubeVariant
  /** A form of a shape-shifting puzzle to draw instead of its box (forms.ts). */
  form?: Cube
  /** One piece alone (by its index), front or back (a tutorial's legend). */
  piece?: { index: number; back: boolean }
  className?: string
}) {
  const { polygons, viewBox } = piece
    ? pieceDrawing(shape, piece.index, piece.back)
    : form
      ? formDrawing(shape, form)
      : isometricDrawing(shape, variant)
  // One color for every sticker on a variant whose stickers tell sizes (a
  // mirror cube) and on a puzzle drawn in one.
  const skin = VARIANT_SKIN[variant] ?? (isPolyDrawn(shape) ? polyDrawing(shape).skin : undefined)
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
