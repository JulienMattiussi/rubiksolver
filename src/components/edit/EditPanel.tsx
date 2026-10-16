import {
  Box,
  Check,
  Cog,
  Eraser,
  Layers,
  Link2,
  Rows3,
  Shapes,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { isComplete, progress } from '@/lib/editor/editor'
import { formsOf } from '@/lib/editor/forms'
import { wholeCount } from '@/lib/editor/cutsEditor'
import { setupOf, type Setup } from '@/lib/editor/setup'
import { gearFaces, gearsPainted } from '@/lib/editor/gearEditor'
import { hasColoredClips, SHAPE_EDIT_HINT } from '@/lib/core/types'
import type { EditHint } from '@/lib/puzzles/entry'
import { stepName, type Translations } from '@/i18n/translations'
import { entersByPieces, placedCount } from '@/lib/editor/pieceEditor'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { ColorPalette } from './ColorPalette'
import { ErrorAlert } from './ErrorAlert'
import { FacesPanel } from './FacesPanel'
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

/** What each setup shows: its hint, its buttons' labels (accept it, come
 *  back to it from the colors) and icon, the error if refused. */
const SETUPS = (
  t: Translations,
): Record<
  Setup,
  { hint: string; accept: string; change: string; icon: LucideIcon; error?: string }
> => ({
  joints: {
    hint: t.editHintJoints,
    accept: t.acceptJoints,
    change: t.changeJoints,
    icon: Link2,
    error: t.errorJoints,
  },
  cuts: {
    hint: t.editHintCuts,
    accept: t.acceptCuts,
    change: t.changeCuts,
    icon: Layers,
    error: t.errorCuts,
  },
  faces: { hint: t.editHintFaces, accept: t.findShape, change: t.changeFaces, icon: Box },
  bars: { hint: t.editHintBars, accept: t.acceptBars, change: t.changeBars, icon: Rows3 },
  gears: { hint: t.editHintGears, accept: t.acceptGears, change: t.changeGears, icon: Cog },
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
 *  a setup first on some (setup.ts: joints, halves, bars, gears, clicked in
 *  3D), then hint, color palette, progress, validation error, actions. A puzzle
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
  const acceptSetup = useEditor((s) => s.acceptSetup)
  const editSetup = useEditor((s) => s.editSetup)
  const cuts = useEditor((s) => s.cuts)
  const setup = setupOf(shape)

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

  if (phase === 'faces') return <FacesPanel />

  if (phase !== 'paint') {
    const { hint, accept, error: refused } = SETUPS(t)[phase]
    return (
      <PhasePanel
        hint={hint}
        counter={
          phase === 'joints' ? (
            <PiecesLeft shape={shape} />
          ) : phase === 'cuts' ? (
            <span className="text-sm font-medium text-slate-200">
              {t.wholeEdgesOf(wholeCount(cuts))}
            </span>
          ) : undefined
        }
        error={error === phase ? (refused ?? null) : null}
        accept={accept}
        onAccept={acceptSetup}
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
  // Its forms to pick from, unless its shape is told face by face.
  const shifts = formsOf(shape).length > 1 && setup !== 'faces'

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
        {setup && <ChangeSetup setup={setup} onClick={editSetup} />}
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

/** Back from the colors to the setup. */
function ChangeSetup({ setup, onClick }: { setup: Setup; onClick: () => void }) {
  const t = useI18n((s) => s.t)
  const { change, icon: Icon } = SETUPS(t)[setup]
  return (
    <Button onClick={onClick} variant="ghost" className="col-span-2">
      <Icon className="size-4" aria-hidden />
      {change}
    </Button>
  )
}
