import { Camera, Check, Eraser, FlaskConical, ScanEye, X } from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { isComplete, progress } from '@/lib/editor/edit'
import { entryOf, stepOf, type EntryStep } from '@/lib/editor/entry'
import { placedCount } from '@/lib/editor/modes/pieces'
import { partsDone } from '@/lib/editor/steps'
import { scannable } from '@/lib/editor/scan/plan'
import { SHAPE_EDIT_HINT, SHAPE_SCAN_TRIED } from '@/lib/core/shapes'
import { tellsSizes } from '@/lib/core/shape'
import type { EditHint } from '@/lib/puzzles/entry'
import { stepName, type Translations } from '@/i18n/translations'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useScan } from '@/store/scanStore'
import { hasCamera } from '@/hooks/useCamera'
import { Button } from '@/components/ui/Button'
import { ColorPalette } from './ColorPalette'
import { ErrorAlert } from './ErrorAlert'
import { FacesPanel } from './FacesPanel'
import { FormPicker } from './FormPicker'
import { PhasePanel } from './PhasePanel'
import { PiecesLeft } from './PiecesLeft'
import { ScanView } from './scan/ScanView'
import { stepTexts } from './stepTexts'

/** The editor's own hints, by kind (a puzzle's card says which). */
const HINTS = (t: Translations): Record<EditHint, string> => ({
  twist: t.editHintTwist,
  camo: t.editHintCamo,
  roadblock: t.editHintRoadblock,
  quarter: t.editHintQuarter,
  gear: t.editHintGear,
  gearPlain: t.editHintGearPlain,
})

/** Why the entry is refused: the colors counted wrong (its sizes, where
 *  stickers tell sizes), parts not their pieces' colors, the colors against
 *  the joints, or the state unsolvable (at the step the solver stopped,
 *  when it says). */
function errorText(
  t: Translations,
  error: string,
  failedStep: string | null,
  sizes: boolean,
): string {
  if (error === 'parts') return t.errorGears
  if (error === 'jointsColors') return t.errorJointsColors
  if (error === 'counts') return sizes ? t.errorCountsMirror : t.errorCounts
  if (failedStep && failedStep in t.steps) return t.errorImpossibleAt(stepName(t, failedStep))
  return t.errorImpossible
}

/** Cube-entry panel: the steps the puzzle's model lists first, each its
 *  mode's panel (lib/editor/entry.ts: its form, its faces, its halves, its
 *  joints, toggles), then its colors: hint, palette (none when put piece
 *  by piece: its pieces counted), progress, validation error, actions, and
 *  a way back to each step. */
export function EditPanel() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const phase = useEditor((s) => s.phase)
  const cancel = useEditor((s) => s.cancel)

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
  if (phase === 'canvas') return <FacesPanel />
  if (phase !== 'paint') return <StepPanel step={stepOf(shape, phase)!} />
  return <PaintPanel />
}

/** A step clicked on the puzzle (its halves, its joints, toggles): its
 *  hint, its count, then on. */
function StepPanel({ step }: { step: EntryStep }) {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const error = useEditor((s) => s.error)
  const cuts = useEditor((s) => s.cuts)
  const acceptStep = useEditor((s) => s.acceptStep)
  const { hint, accept, error: refused } = stepTexts(t, step)
  return (
    <PhasePanel
      hint={hint}
      counter={
        step.kind === 'joints' ? (
          <PiecesLeft shape={shape} />
        ) : step.kind === 'cuts' ? (
          <span className="text-sm font-medium text-slate-200">
            {t.wholeEdgesOf(step.cuts.wholes(cuts))}
          </span>
        ) : undefined
      }
      error={error === step.kind ? (refused ?? null) : null}
      accept={accept}
      onAccept={acceptStep}
    />
  )
}

/** The colors: painted, or put piece by piece. */
function PaintPanel() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const sizes = useCube((s) => tellsSizes(s.variant))
  const edit = useEditor((s) => s.edit)
  const clearAll = useEditor((s) => s.clearAll)
  const cancel = useEditor((s) => s.cancel)
  const apply = useEditor((s) => s.apply)
  const error = useEditor((s) => s.error)
  const failedStep = useEditor((s) => s.failedStep)
  const parts = useEditor((s) => s.parts)
  const form = useEditor((s) => s.form)
  const backTo = useEditor((s) => s.backTo)
  const scanning = useScan((s) => s.open)
  const fromScan = useEditor((s) => s.fromScan)
  const startScan = useScan((s) => s.start)
  const { steps, paint } = entryOf(shape)
  // A camera reads a cube's colors (lib/editor/scan/).
  const canScan = !sizes && scannable(shape) && hasCamera()

  const byPieces = paint.by === 'pieces'
  const hint = SHAPE_EDIT_HINT[shape]
  const { filled, total } = progress(edit, shape, form)
  const { placed, total: slots } = byPieces ? placedCount(edit, shape) : { placed: 0, total: 0 }
  const complete = isComplete(edit, shape, form) && partsDone(shape, parts)
  // Parts painted apart count with the stickers: every face to paint.
  const counted = paint.parts?.count(parts)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs leading-relaxed text-slate-400">
        {hint
          ? HINTS(t)[hint]
          : byPieces
            ? t.editHintPieces
            : sizes
              ? t.editHintMirror
              : t.editHint}
      </p>

      {!byPieces && <ColorPalette />}

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-200">
          {byPieces
            ? t.piecesOf(placed, slots)
            : counted
              ? t.facesOf(filled + counted.painted, total + counted.total)
              : t.filledOf(filled, total)}
        </span>
        {complete && <Check className="size-4 text-emerald-400" aria-hidden />}
      </div>

      {fromScan && (
        <p className="flex gap-2 rounded-lg bg-sky-500/15 px-3 py-2 text-sm text-sky-100 ring-1 ring-inset ring-sky-400/40">
          <ScanEye className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t.scanCheck}
        </p>
      )}

      {error && <ErrorAlert>{errorText(t, error, failedStep, sizes)}</ErrorAlert>}

      <div className="grid grid-cols-2 gap-2">
        {canScan && (
          <Button variant="edit" onClick={startScan} className="col-span-2">
            <Camera className="size-4" aria-hidden />
            {t.scanStart}
            {/* Not yet tried on the real puzzle: said so. */}
            {!SHAPE_SCAN_TRIED[shape] && (
              <span title={t.scanUntried} role="img" aria-label={t.scanUntried}>
                <FlaskConical className="size-4 text-amber-300" aria-hidden />
              </span>
            )}
          </Button>
        )}
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
        {steps.map((step) => {
          const { change, icon: Icon } = stepTexts(t, step)
          return (
            <Button
              key={step.kind}
              onClick={() => backTo(step.kind)}
              variant="ghost"
              className="col-span-2"
            >
              <Icon className="size-4" aria-hidden />
              {change}
            </Button>
          )
        })}
      </div>
      {scanning && <ScanView />}
    </div>
  )
}
