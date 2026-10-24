import { cubeShape } from '@/lib/core/cube'
import { progress } from '@/lib/editor/edit'
import { paletteColors } from '@/lib/editor/modes/colors'
import { entryOf } from '@/lib/editor/entry'
import { byThickness, LAYER_THICKNESS, tellsSizes } from '@/lib/core/shape'
import type { CubeColor } from '@/lib/core/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useColorName } from '@/hooks/useColorName'
import { COLOR_HEX, VARIANT_SKIN } from '@/three/core/colors'
import { SECTION_LABEL } from '@/components/ui/styles'

/** Width of a thickness swatch. The scale is stretched over the whole button:
 *  the real thicknesses (a mirror's span 0.44..1.56) are too close to tell two
 *  neighbors apart in a 5 rem chip. Order and the thin/thick grouping are
 *  preserved. */
function swatchWidth(thickness: number, all: readonly number[]): string {
  const [thinnest, thickest] = [Math.min(...all), Math.max(...all)]
  return `${20 + (80 * (thickness - thinnest)) / (thickest - thinnest)}%`
}

/** Swatches with the remaining count, picking what a click paints: a color, or
 *  a layer thickness on a variant whose stickers tell sizes (a mirror cube;
 *  each thickness is one color's, so the editor underneath is the same). */
export function ColorPalette() {
  const t = useI18n((s) => s.t)
  const colorName = useColorName()
  const shape = useCube((s) => cubeShape(s.cube))
  const variant = useCube((s) => s.variant)
  const sizes = tellsSizes(variant)
  const thickness = LAYER_THICKNESS[variant]
  const edit = useEditor((s) => s.edit)
  const selected = useEditor((s) => s.selectedColor)
  const setColor = useEditor((s) => s.setColor)
  const form = useEditor((s) => s.form)
  const { remaining } = progress(edit, shape, form)
  // Parts painted apart take these colors too (a Gear Cube's gears).
  const parts = useEditor((s) => s.parts)
  const partsLeft = entryOf(shape).paint.parts?.count(parts).remaining ?? {}
  // Thinnest first, so the swatches read as a scale.
  const colors = paletteColors(shape, form)
  const palette = sizes ? byThickness(thickness).filter((c) => colors.includes(c)) : colors
  const title = sizes ? t.paletteMirror : t.palette

  return (
    <div>
      <h2 className={`mb-2 ${SECTION_LABEL}`}>{title}</h2>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={title}>
        {palette.map((c, rank) => {
          const left = remaining[c] + (partsLeft[c] ?? 0)
          return (
            <button
              key={c}
              role="radio"
              aria-checked={selected === c}
              aria-label={`${sizes ? t.thickness(rank + 1) : colorName(c)} (${left})`}
              title={sizes ? t.thickness(rank + 1) : colorName(c)}
              onClick={() => setColor(c)}
              // None left: dimmed, still chosen (a paint takes it back from
              // where it is, see `paint`).
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-2 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                selected === c ? 'border-white' : 'border-transparent hover:border-slate-500'
              } ${sizes ? 'bg-slate-800 text-slate-200' : ''} ${left <= 0 && selected !== c ? 'opacity-40' : ''}`}
              style={sizes ? undefined : { backgroundColor: COLOR_HEX[c], color: '#0b0f1a' }}
            >
              {sizes && (
                <span className="flex-1" aria-hidden>
                  <span
                    className="block h-3.5 rounded-sm"
                    style={{
                      // Only the cubes come so: their six colors.
                      width: swatchWidth(thickness[c as CubeColor], Object.values(thickness)),
                      backgroundColor: VARIANT_SKIN[variant],
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
