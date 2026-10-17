import { ArrowRight, GraduationCap, Sparkles, Undo2, X } from 'lucide-react'
import { useEffect } from 'react'
import { formatMove } from '@/lib/core/moves'
import { useI18n } from '@/i18n/i18nStore'
import { useView } from '@/store/viewStore'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { useTutorial } from '@/hooks/useTutorial'
import { Button } from '@/components/ui/Button'
import { SECTION_BOX, SECTION_LABEL } from '@/components/ui/styles'
import { Instructions } from './Instructions'
import { GoldTrophy } from './GoldTrophy'
import { StepHeading } from './StepHeading'
import { liftFor } from './liftFor'

/** In place of the solve block while the tutorial is on: its step
 *  (`StepHeading`) and its instructions (`Instructions`), applying the
 *  formula (or finishing it, after turns by hand) or undoing it. Once
 *  played, a stop until `next`. */
export function TutorialPanel() {
  const t = useI18n((s) => s.t)
  const busy = useCube(selectBusy)
  const apply = useTutorialStore((s) => s.apply)
  const learn = useTutorialStore((s) => s.learn)
  const undo = useTutorialStore((s) => s.undo)
  const exit = useTutorialStore((s) => s.exit)
  const next = useTutorialStore((s) => s.next)
  const played = useTutorialStore((s) => s.played).length > 0
  // Turns by hand since the step began: applying finishes it from there.
  const manual = useTutorialStore((s) => s.manual).length > 0
  const view = useTutorial()
  const { step, moves, pick, review, progress, hold, frame } = view
  const setHold = useTutorialStore((s) => s.setHold)
  const showStage = useTutorialStore((s) => s.showStage)
  // The stage of the step shown, noted (a stage skipped over is then shown
  // in passing, see useTutorial).
  useEffect(() => {
    if (step?.stage && !step.alreadyDone) showStage(step.stage)
  }, [step, showStage])
  const lift = liftFor(step)
  const viewToward = useView((s) => s.viewToward)
  // A new way to hold the puzzle: the pad follows it, and the view turns to
  // its front center (the cube's, wherever it stands).
  useEffect(() => {
    setHold(hold)
    if (!hold) return
    const front = useCube
      .getState()
      .cube.find(
        (c) => c.stickers.length === 1 && c.stickers[0]!.normal.join() === frame.front(hold).join(),
      )
    if (front) viewToward(front.stickers[0]!.normal, lift)
  }, [hold, frame, lift, setHold, viewToward])
  return (
    <section aria-label={t.tutorial.button} className={SECTION_BOX}>
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
      {step && <StepHeading step={step} progress={progress} stages={view.stages} />}
      {/* Every stage done: the puzzle solved. */}
      {!step && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <GoldTrophy className="size-32 drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]" />
          <p className="text-lg font-bold text-emerald-300">{t.tutorial.solved}</p>
        </div>
      )}
      {/* A stage the puzzle already meets: said so, then on. */}
      {step?.alreadyDone && (
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
      {step && !step.comingSoon && !step.alreadyDone && (
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
            <Button onClick={undo} disabled={busy || (!played && !manual)}>
              <Undo2 className="size-4" aria-hidden />
              {t.tutorial.undo}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
