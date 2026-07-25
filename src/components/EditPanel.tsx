import { Check, Eraser, X } from 'lucide-react'
import { colorCounts, filledCount, isComplete } from '@/lib/editor'
import type { Color } from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX } from '@/three/colors'
import { Button } from './ui/Button'

const PALETTE: readonly Color[] = ['W', 'Y', 'G', 'B', 'O', 'R']

export function EditPanel() {
  const t = useI18n((s) => s.t)
  const edit = useEditor((s) => s.edit)
  const selected = useEditor((s) => s.selectedColor)
  const setColor = useEditor((s) => s.setColor)
  const clearAll = useEditor((s) => s.clearAll)
  const cancel = useEditor((s) => s.cancel)
  const apply = useEditor((s) => s.apply)
  const error = useEditor((s) => s.error)

  const counts = colorCounts(edit)
  const filled = filledCount(edit)
  const complete = isComplete(edit)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs leading-relaxed text-slate-400">{t.editHint}</p>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.palette}
        </h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t.palette}>
          {PALETTE.map((c) => {
            const remaining = 9 - counts[c]
            return (
              <button
                key={c}
                role="radio"
                aria-checked={selected === c}
                aria-label={`${t.colors[c]} (${remaining})`}
                disabled={remaining <= 0 && selected !== c}
                onClick={() => setColor(c)}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-2 py-2 text-sm font-semibold transition disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
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

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-200">{t.filledOf(filled)}</span>
        {complete && <Check className="size-4 text-emerald-400" aria-hidden />}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300">
          {error === 'counts' ? t.errorCounts : t.errorImpossible}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={apply} disabled={!complete} className="col-span-2">
          <Check className="size-4" aria-hidden />
          {t.applyCube}
        </Button>
        <Button onClick={clearAll}>
          <Eraser className="size-4" aria-hidden />
          {t.clearAll}
        </Button>
        <Button onClick={cancel}>
          <X className="size-4" aria-hidden />
          {t.cancel}
        </Button>
      </div>
    </div>
  )
}
