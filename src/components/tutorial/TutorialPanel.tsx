import {
  ArrowRight,
  GraduationCap,
  NotebookText,
  SkipForward,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react'
import { useEffect } from 'react'
import { cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/notation'
import { tutorialFor } from '@/lib/tutorials/registry'
import { useI18n } from '@/i18n/i18nStore'
import { useView } from '@/store/viewStore'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { useTutorialTrack } from '@/store/tutorialTrack'
import { useTutorial } from '@/hooks/useTutorial'
import { Button } from '@/components/ui/Button'
import { SECTION_BOX, SECTION_LABEL } from '@/components/ui/styles'
import { Instructions } from './Instructions'
import { FormulaRecap } from './FormulaRecap'
import { GoldTrophy } from './GoldTrophy'
import { StepHeading } from './StepHeading'
import { liftFor } from './liftFor'
import { turnsWhole } from '@/lib/teach/scene'

/** In place of the solve block while the tutorial is on: its step
 *  (`StepHeading`) and its instructions (`Instructions`), applying the
 *  formula (or finishing it, after turns by hand) or undoing it. Once
 *  played, a stop until `next`. */
export function TutorialPanel() {
  const t = useI18n((s) => s.t)
  const busy = useCube(selectBusy)
  const apply = useTutorialStore((s) => s.apply)
  const learn = useTutorialTrack((s) => s.learn)
  const undo = useTutorialStore((s) => s.undo)
  const exit = useTutorialStore((s) => s.exit)
  const next = useTutorialStore((s) => s.next)
  const played = useTutorialStore((s) => s.played).length > 0
  // Turns by hand since the step began: applying finishes it from there.
  const manual = useTutorialStore((s) => s.manual).length > 0
  const view = useTutorial()
  const { step, moves, pick, review, progress, hold, frame } = view
  const setHold = useTutorialStore((s) => s.setHold)
  const showStage = useTutorialTrack((s) => s.showStage)
  const cheer = useTutorialTrack((s) => s.cheer)
  const showTerm = useTutorialTrack((s) => s.showTerm)
  const setTermsShown = useTutorialTrack((s) => s.setTermsShown)
  // The tutorial played, its reminder offered from the start once it has
  // been played through.
  const shape = useCube((s) => cubeShape(s.cube))
  const method = useCube((s) => s.method)
  const tutorial = tutorialFor(shape, method)
  const id = `${shape}/${method}`
  const playedThrough = useTutorialTrack((s) => s.playedThrough.includes(id))
  const playThrough = useTutorialTrack((s) => s.playThrough)
  const recapShown = useTutorialTrack((s) => s.recapShown)
  const showRecap = useTutorialTrack((s) => s.showRecap)
  // The end come (every stage shown, the puzzle solved): the cup, and the
  // fireworks with it, not before.
  const over = !step
  useEffect(() => {
    if (!over) return
    cheer()
    playThrough(id)
  }, [over, cheer, playThrough, id])
  // The stage of the step shown, noted (a stage skipped over is then shown
  // in passing, see useTutorial).
  useEffect(() => {
    if (step?.stage && step.kind !== 'alreadyDone') showStage(step.stage)
  }, [step, showStage])
  const lift = liftFor(step)
  const viewToward = useView((s) => s.viewToward)
  // The formula played ended its stage (all its pieces placed): the side it
  // finished, shown until on to the next step.
  const finished =
    review && !busy && progress !== null && progress.done === progress.total
      ? (step?.shows ?? null)
      : null
  // On a word of the glossary: where its pieces are seen from.
  const termFrom = view.term?.from
  // A new way to hold the puzzle: the pad follows it, and the view turns to
  // the side held in front (or to the side just finished, or to a word's
  // pieces).
  useEffect(() => {
    setHold(hold)
    if (termFrom !== undefined) {
      if (termFrom) viewToward(termFrom)
    } else if (finished) viewToward(finished)
    else if (hold) viewToward(frame.front(hold), lift)
  }, [hold, frame, lift, finished, termFrom, setHold, viewToward])
  const header = (
    <div className="flex items-center justify-between">
      <h2 className={`${SECTION_LABEL} flex items-center gap-2`}>
        <GraduationCap className="size-4" aria-hidden />
        {t.tutorial.button}
      </h2>
      <button
        type="button"
        onClick={exit}
        title={t.tutorial.exit}
        aria-label={t.tutorial.exit}
        className="rounded p-1 text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
  // The reminder asked for: shown in place of the step, until back.
  if (recapShown && tutorial) {
    return (
      <section aria-label={t.tutorial.button} className={SECTION_BOX}>
        {header}
        <FormulaRecap tutorial={tutorial} />
        <Button onClick={() => showRecap(false)}>
          <Undo2 className="size-4" aria-hidden />
          {t.tutorial.recapBack}
        </Button>
      </section>
    )
  }
  return (
    <section aria-label={t.tutorial.button} className={SECTION_BOX}>
      {header}
      {step && (
        <StepHeading
          step={step}
          progress={progress}
          stages={view.stages}
          hatched={!turnsWhole(view.moves ?? [])}
        />
      )}
      {/* Every stage done: the puzzle solved. */}
      {!step && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <GoldTrophy className="size-32 drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]" />
          <p className="text-lg font-bold text-emerald-300">{t.tutorial.solved}</p>
          {tutorial && <FormulaRecap tutorial={tutorial} />}
          <Button onClick={exit} className="mt-2 w-full">
            <X className="size-4" aria-hidden />
            {t.tutorial.close}
          </Button>
        </div>
      )}
      {/* A stage the puzzle already meets: said so, then on. */}
      {step?.kind === 'alreadyDone' && (
        <>
          <p className="text-xs leading-relaxed text-slate-300">
            {t.tutorial.alreadyDone}
            <br />
            {t.tutorial.alreadyDoneNext}
          </p>
          <Button variant="solve" onClick={() => showStage(step.stage!)} disabled={busy}>
            <ArrowRight className="size-4" aria-hidden />
            {t.tutorial.next}
          </Button>
        </>
      )}
      {/* A word of the glossary: on to the next, or past them all. */}
      {step?.kind === 'term' && (
        <div className="flex flex-col gap-2">
          <Button variant="solve" onClick={showTerm}>
            <ArrowRight className="size-4" aria-hidden />
            {t.tutorial.next}
          </Button>
          <Button onClick={() => setTermsShown(view.term?.count ?? 0)}>
            <SkipForward className="size-4" aria-hidden />
            {t.tutorial.skipTerms}
          </Button>
          {playedThrough && (
            <Button onClick={() => showRecap(true)}>
              <NotebookText className="size-4" aria-hidden />
              {t.tutorial.recap}
            </Button>
          )}
        </div>
      )}
      {step && step.kind !== 'toCome' && step.kind !== 'alreadyDone' && step.kind !== 'term' && (
        <>
          <Instructions view={view} busy={busy} />
          <div className="flex flex-col gap-2">
            {review ? (
              <Button variant="solve" onClick={next} disabled={busy}>
                <ArrowRight className="size-4" aria-hidden />
                {t.tutorial.next}
              </Button>
            ) : (
              <Button
                variant="solve"
                onClick={() => {
                  if (!moves) return
                  // The moves shown, learnt from now on.
                  if (hold && view.shown) {
                    learn(view.shown.moves.map((m) => formatMove(frame.inHold(hold, m))))
                  }
                  apply({ key: step.key, moves }, pick)
                }}
                disabled={busy || !moves || (moves.length === 0 && !manual)}
              >
                <Sparkles className="size-4" aria-hidden />
                {manual ? t.tutorial.finish : t.tutorial.apply}
              </Button>
            )}
            {/* Nothing played yet: back to the glossary's start instead. */}
            {!played && !manual && view.glossary > 0 ? (
              <Button onClick={() => setTermsShown(0)} disabled={busy}>
                <Undo2 className="size-4" aria-hidden />
                {t.tutorial.backToGlossary}
              </Button>
            ) : (
              <Button onClick={undo} disabled={busy || (!played && !manual)}>
                <Undo2 className="size-4" aria-hidden />
                {t.tutorial.undo}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
