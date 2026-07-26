import { Check, Eraser, X } from 'lucide-react'
import { cubeShape, stickersTotal } from '@/lib/cube'
import { filledCount, isComplete } from '@/lib/editor'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { ColorPalette } from './ColorPalette'

/** "Saisie" panel: hint, color palette, progress, validation error, actions. */
export function EditPanel() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const mirror = useCube((s) => s.variant === 'mirror')
  const edit = useEditor((s) => s.edit)
  const clearAll = useEditor((s) => s.clearAll)
  const cancel = useEditor((s) => s.cancel)
  const apply = useEditor((s) => s.apply)
  const error = useEditor((s) => s.error)

  const filled = filledCount(edit)
  const complete = isComplete(edit, shape)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs leading-relaxed text-slate-400">
        {mirror ? t.editHintMirror : t.editHint}
      </p>

      <ColorPalette />

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-200">
          {t.filledOf(filled, stickersTotal(shape))}
        </span>
        {complete && <Check className="size-4 text-emerald-400" aria-hidden />}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300">
          {error !== 'counts' ? t.errorImpossible : mirror ? t.errorCountsMirror : t.errorCounts}
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
