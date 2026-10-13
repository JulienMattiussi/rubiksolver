import { Check, Eraser, Shapes, X } from 'lucide-react'
import { cubeShape } from '@/lib/cube'
import { isComplete, progress } from '@/lib/editor'
import { formsOf } from '@/lib/forms'
import { gearFaces, gearsPainted } from '@/lib/gearEditor'
import { hasColoredClips, isGear } from '@/lib/types'
import { entersByPieces, placedCount } from '@/lib/pieceEditor'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { ColorPalette } from './ColorPalette'
import { FormPicker } from './FormPicker'

/** Cube-entry panel: the form first on a shape-shifting puzzle (FormPicker),
 *  then hint, color palette, progress, validation error, actions. A puzzle
 *  entered piece by piece (the Floppy Ghost) has no palette: it counts its
 *  pieces placed. */
export function EditPanel() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const mirror = useCube((s) => s.variant === 'mirror')
  const edit = useEditor((s) => s.edit)
  const clearAll = useEditor((s) => s.clearAll)
  const cancel = useEditor((s) => s.cancel)
  const apply = useEditor((s) => s.apply)
  const error = useEditor((s) => s.error)
  const failedStep = useEditor((s) => s.failedStep)
  const gear = useEditor((s) => s.gear)
  const phase = useEditor((s) => s.phase)
  const form = useEditor((s) => s.form)
  const pickForm = useEditor((s) => s.pickForm)

  if (phase === 'form') {
    return (
      <div className="flex flex-col gap-4">
        <FormPicker />
        <Button onClick={cancel}>
          <X className="size-4" aria-hidden />
          {t.cancel}
        </Button>
      </div>
    )
  }

  const byPieces = entersByPieces(shape)
  const { filled, total } = progress(edit, shape, form)
  const { placed, total: slots } = byPieces ? placedCount(edit, shape) : { placed: 0, total: 0 }
  // A Gear Cube's gears are painted apart from their clips.
  const gears = hasColoredClips(shape) ? gearsPainted(gear) : null
  const complete = isComplete(edit, shape, form) && (!gears || gears.painted === gears.total)
  // Counted with the stickers: every face to paint, clips and gears alike.
  const faces = hasColoredClips(shape) ? gearFaces(gear) : null
  const shifts = formsOf(shape).length > 1

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs leading-relaxed text-slate-400">
        {byPieces
          ? t.editHintPieces
          : mirror
            ? t.editHintMirror
            : hasColoredClips(shape)
              ? t.editHintGear
              : isGear(shape)
                ? t.editHintGearPlain
                : t.editHint}
      </p>

      {!byPieces && <ColorPalette />}

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-200">
          {byPieces
            ? t.piecesOf(placed, slots)
            : faces
              ? t.facesOf(filled + faces.painted, total + faces.total)
              : t.filledOf(filled, total)}
        </span>
        {complete && <Check className="size-4 text-emerald-400" aria-hidden />}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300">
          {error === 'gears'
            ? t.errorGears
            : error !== 'counts'
              ? failedStep && failedStep in t.steps
                ? t.errorImpossibleAt((t.steps as Record<string, string>)[failedStep]!)
                : t.errorImpossible
              : mirror
                ? t.errorCountsMirror
                : t.errorCounts}
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
        {shifts && (
          <Button onClick={() => pickForm(null)} variant="ghost" className="col-span-2">
            <Shapes className="size-4" aria-hidden />
            {t.changeForm}
          </Button>
        )}
      </div>
    </div>
  )
}
