import { byThickness, LAYER_THICKNESS } from '@/lib/core/shape'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { VARIANT_SKIN } from '@/three/core/colors'
import { useTutorialTexts } from './useTutorialTexts'

/** A middle layer's thickness on the scale, px (the cube's cell). */
const CELL = 40

/** A mirror cube's six thicknesses side by side, thinnest first, each
 *  drawn as its layer seen from the side, to scale against a middle layer
 *  (dashed), and named: the words that name its sides, at a glance (in
 *  place of the glossary's words for them, in its window). */
export function ThicknessScale() {
  const tx = useTutorialTexts()
  const intro = useI18n((s) => s.t.tutorialMirror.thicknessIntro)
  const variant = useCube((s) => s.variant)
  const thickness = LAYER_THICKNESS[variant]
  const name = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
  return (
    <section className="mt-4 border-t border-slate-700 pt-3">
      <h3 className="text-sm font-semibold text-white">{tx.thicknesses}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{intro}</p>
      <div className="relative mt-3">
        {/* A middle layer's height, from the slabs' foot. */}
        <div
          className="absolute inset-x-0 border-t border-dashed border-slate-400"
          style={{ bottom: CELL }}
          aria-hidden
        />
        <ul className="relative grid grid-cols-6 items-end gap-2">
          {byThickness(thickness).map((c) => (
            <li key={c} className="flex justify-center">
              <span
                className="block w-full max-w-10 rounded-sm ring-1 ring-black/60"
                style={{ height: thickness[c] * CELL, backgroundColor: VARIANT_SKIN[variant] }}
                aria-hidden
              />
            </li>
          ))}
        </ul>
      </div>
      <ul className="mt-1 grid grid-cols-6 gap-2 text-center text-[11px] leading-tight text-slate-300">
        {byThickness(thickness).map((c) => (
          <li key={c}>{name(tx.colorName(c))}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-400">{tx.thicknessMiddle}</p>
    </section>
  )
}
