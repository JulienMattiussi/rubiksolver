import { cubeSize, stickersPerColor } from '@/lib/cube'
import { colorCounts } from '@/lib/editor'
import type { Color } from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX } from '@/three/colors'

const PALETTE: readonly Color[] = ['W', 'Y', 'G', 'B', 'O', 'R']

/** Color swatches with the remaining count per color; picks the paint color. */
export function ColorPalette() {
  const t = useI18n((s) => s.t)
  const size = useCube((s) => cubeSize(s.cube))
  const edit = useEditor((s) => s.edit)
  const selected = useEditor((s) => s.selectedColor)
  const setColor = useEditor((s) => s.setColor)
  const counts = colorCounts(edit)
  const perColor = stickersPerColor(size)

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t.palette}
      </h2>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t.palette}>
        {PALETTE.map((c) => {
          const remaining = perColor - counts[c]
          return (
            <button
              key={c}
              role="radio"
              aria-checked={selected === c}
              aria-label={`${t.colors[c]} (${remaining})`}
              disabled={remaining <= 0 && selected !== c}
              onClick={() => setColor(c)}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-2 py-2 text-sm font-semibold transition disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                selected === c ? 'border-white' : 'border-transparent hover:border-slate-500'
              }`}
              style={{ backgroundColor: COLOR_HEX[c], color: '#0b0f1a' }}
            >
              {t.colors[c].charAt(0)}
              <span className="tabular-nums">{remaining}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
