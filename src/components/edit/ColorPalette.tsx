import { cubeShape } from '@/lib/cube'
import { gearFaces } from '@/lib/gearEditor'
import { paletteColors, progress } from '@/lib/editor'
import { byThickness, LAYER_THICKNESS } from '@/lib/shape'
import { isGear, type CubeColor } from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX, MIRROR_STICKER } from '@/three/colors'
import { SECTION_LABEL } from '@/components/ui/styles'

const MIRROR_THICKNESS = LAYER_THICKNESS.mirror
const THINNEST = Math.min(...Object.values(MIRROR_THICKNESS))
const THICKEST = Math.max(...Object.values(MIRROR_THICKNESS))

/** Width of a thickness swatch. The scale is stretched over the whole button:
 *  the real thicknesses span 0.58..1.42, too narrow to tell two neighbors
 *  apart in a 5 rem chip. Order and the thin/thick grouping are preserved. */
function swatchWidth(thickness: number): string {
  return `${20 + (80 * (thickness - THINNEST)) / (THICKEST - THINNEST)}%`
}

/** Swatches with the remaining count, picking what a click paints: a color, or
 *  a layer thickness on a mirror cube (each thickness is one color's, so the
 *  editor underneath is the same). */
export function ColorPalette() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const mirror = useCube((s) => s.variant === 'mirror')
  const edit = useEditor((s) => s.edit)
  const selected = useEditor((s) => s.selectedColor)
  const setColor = useEditor((s) => s.setColor)
  const form = useEditor((s) => s.form)
  const { remaining } = progress(edit, shape, form)
  // A Gear Cube's gears take these colors too, painted apart.
  const gear = useEditor((s) => s.gear)
  const gearLeft = isGear(shape) ? gearFaces(gear).remaining : {}
  // Thinnest first, so the swatches read as a scale.
  const colors = paletteColors(shape, form)
  const palette = mirror ? byThickness(MIRROR_THICKNESS).filter((c) => colors.includes(c)) : colors
  const title = mirror ? t.paletteMirror : t.palette

  return (
    <div>
      <h2 className={`mb-2 ${SECTION_LABEL}`}>{title}</h2>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={title}>
        {palette.map((c, rank) => {
          const left = remaining[c] + (gearLeft[c] ?? 0)
          return (
            <button
              key={c}
              role="radio"
              aria-checked={selected === c}
              aria-label={`${mirror ? t.thickness(rank + 1) : t.colors[c]} (${left})`}
              title={mirror ? t.thickness(rank + 1) : t.colors[c]}
              disabled={left <= 0 && selected !== c}
              onClick={() => setColor(c)}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-2 py-2 text-sm font-semibold transition disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                selected === c ? 'border-white' : 'border-transparent hover:border-slate-500'
              } ${mirror ? 'bg-slate-800 text-slate-200' : ''}`}
              style={mirror ? undefined : { backgroundColor: COLOR_HEX[c], color: '#0b0f1a' }}
            >
              {mirror && (
                <span className="flex-1" aria-hidden>
                  <span
                    className="block h-3.5 rounded-sm"
                    style={{
                      // Only the cubes come as mirrors: their six colors.
                      width: swatchWidth(MIRROR_THICKNESS[c as CubeColor]),
                      backgroundColor: MIRROR_STICKER,
                    }}
                  />
                </span>
              )}
              <span className="tabular-nums">{left}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
