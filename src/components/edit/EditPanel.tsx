import { Check, Eraser, Layers, Link2, Shapes, X } from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { isComplete, progress } from '@/lib/editor/editor'
import { formsOf } from '@/lib/editor/forms'
import { entersJoints } from '@/lib/editor/jointsEditor'
import { entersCuts, wholeCount } from '@/lib/editor/cutsEditor'
import { gearFaces, gearsPainted } from '@/lib/editor/gearEditor'
import { hasColoredClips, SHAPE_EDIT_HINT } from '@/lib/core/types'
import type { EditHint } from '@/lib/puzzles/entry'
import { stepName, type Translations } from '@/i18n/translations'
import { entersByPieces, placedCount } from '@/lib/editor/pieceEditor'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { BarToggles } from './BarToggles'
import { ColorPalette } from './ColorPalette'
import { ErrorAlert } from './ErrorAlert'
import { FormPicker } from './FormPicker'
import { PhasePanel } from './PhasePanel'
import { PiecesLeft } from './PiecesLeft'

/** The editor's own hints, by kind (a puzzle's card says which). */
const HINTS = (t: Translations): Record<EditHint, string> => ({
  twist: t.editHintTwist,
  camo: t.editHintCamo,
  roadblock: t.editHintRoadblock,
  quarter: t.editHintQuarter,
  gear: t.editHintGear,
  gearPlain: t.editHintGearPlain,
})

/** Why the entry is refused: the colors counted wrong (on a mirror cube,
 *  its sizes), the gears, the colors against the joints, or the state
 *  unsolvable (at the step the solver stopped, when it says). */
function errorText(
  t: Translations,
  error: string,
  failedStep: string | null,
  mirror: boolean,
): string {
  if (error === 'gears') return t.errorGears
  if (error === 'jointsColors') return t.errorJointsColors
  if (error === 'counts') return mirror ? t.errorCountsMirror : t.errorCounts
  if (failedStep && failedStep in t.steps) return t.errorImpossibleAt(stepName(t, failedStep))
  return t.errorImpossible
}

/** Cube-entry panel: the form first on a shape-shifting puzzle (FormPicker),
 *  the joints first on a bandaged one whose blocks move (JointHandles),
 *  then hint, color palette, progress, validation error, actions. A puzzle
 *  entered piece by piece (Floppy Ghost, Z-Twist) has no palette: it counts its
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
  const acceptJoints = useEditor((s) => s.acceptJoints)
  const editJoints = useEditor((s) => s.editJoints)
  const cuts = useEditor((s) => s.cuts)
  const acceptCuts = useEditor((s) => s.acceptCuts)
  const editCuts = useEditor((s) => s.editCuts)

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

  if (phase === 'cuts') {
    return (
      <PhasePanel
        hint={t.editHintCuts}
        counter={
          <span className="text-sm font-medium text-slate-200">
            {t.wholeEdgesOf(wholeCount(cuts))}
          </span>
        }
        error={error === 'cuts' ? t.errorCuts : null}
        accept={t.acceptCuts}
        onAccept={acceptCuts}
      />
    )
  }

  if (phase === 'joints') {
    return (
      <PhasePanel
        hint={t.editHintJoints}
        counter={<PiecesLeft shape={shape} />}
        error={error === 'joints' ? t.errorJoints : null}
        accept={t.acceptJoints}
        onAccept={acceptJoints}
      />
    )
  }

  const byPieces = entersByPieces(shape)
  const hint = SHAPE_EDIT_HINT[shape]
  const { filled, total } = progress(edit, shape, form)
  const { placed, total: slots } = byPieces ? placedCount(edit, shape) : { placed: 0, total: 0 }
  // A Gear Cube's gears are painted apart from their clips.
  const gears = hasColoredClips(shape) ? gearsPainted(gear, shape) : null
  const complete = isComplete(edit, shape, form) && (!gears || gears.painted === gears.total)
  // Counted with the stickers: every face to paint, clips and gears alike.
  const faces = hasColoredClips(shape) ? gearFaces(gear, shape) : null
  const shifts = formsOf(shape).length > 1

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs leading-relaxed text-slate-400">
        {hint
          ? HINTS(t)[hint]
          : byPieces
            ? t.editHintPieces
            : mirror
              ? t.editHintMirror
              : t.editHint}
      </p>

      {hint === 'roadblock' && <BarToggles />}

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

      {error && <ErrorAlert>{errorText(t, error, failedStep, mirror)}</ErrorAlert>}

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
        {entersJoints(shape) && (
          <Button onClick={editJoints} variant="ghost" className="col-span-2">
            <Link2 className="size-4" aria-hidden />
            {t.changeJoints}
          </Button>
        )}
        {entersCuts(shape) && (
          <Button onClick={editCuts} variant="ghost" className="col-span-2">
            <Layers className="size-4" aria-hidden />
            {t.changeCuts}
          </Button>
        )}
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
