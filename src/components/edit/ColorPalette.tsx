import { cubeSize, stickersPerColor } from '@/lib/cube'
import { colorCounts } from '@/lib/editor'
import { byThickness, LAYER_THICKNESS } from '@/lib/shape'
import type { Color } from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX, MIRROR_STICKER } from '@/three/colors'

const PALETTE: readonly Color[] = ['W', 'Y', 'G', 'B', 'O', 'R']

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
  const size = useCube((s) => cubeSize(s.cube))
  const mirror = useCube((s) => s.variant === 'mirror')
  const edit = useEditor((s) => s.edit)
  const selected = useEditor((s) => s.selectedColor)
  const setColor = useEditor((s) => s.setColor)
  const counts = colorCounts(edit)
  const perColor = stickersPerColor(size)
  // Thinnest first, so the swatches read as a scale.
  const palette = mirror ? byThickness(MIRROR_THICKNESS) : PALETTE
  const title = mirror ? t.paletteMirror : t.palette

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={title}>
        {palette.map((c, rank) => {
          const remaining = perColor - counts[c]
          return (
            <button
              key={c}
              role="radio"
              aria-checked={selected === c}
              aria-label={`${mirror ? t.thickness(rank + 1) : t.colors[c]} (${remaining})`}
              disabled={remaining <= 0 && selected !== c}
              onClick={() => setColor(c)}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-2 py-2 text-sm font-semibold transition disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                selected === c ? 'border-white' : 'border-transparent hover:border-slate-500'
              } ${mirror ? 'bg-slate-800 text-slate-200' : ''}`}
              style={mirror ? undefined : { backgroundColor: COLOR_HEX[c], color: '#0b0f1a' }}
            >
              {mirror ? (
                <span className="flex-1" aria-hidden>
                  <span
                    className="block h-3.5 rounded-sm"
                    style={{
                      width: swatchWidth(MIRROR_THICKNESS[c]),
                      backgroundColor: MIRROR_STICKER,
                    }}
                  />
                </span>
              ) : (
                t.colors[c].charAt(0)
              )}
              <span className="tabular-nums">{remaining}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
