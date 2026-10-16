import { ArrowRight, GraduationCap, Sparkles, Undo2, X } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { useTutorial } from '@/hooks/useTutorial'
import { Button } from '@/components/ui/Button'
import { SECTION_BOX, SECTION_LABEL } from '@/components/ui/styles'
import { StepList } from '@/components/solve/StepList'
import { Instructions } from './Instructions'
import { StepHeading } from './StepHeading'

/** In place of the solve block while the tutorial is on: its step
 *  (`StepHeading`) and its instructions (`Instructions`), applying the
 *  formula (or finishing it, after turns by hand) or undoing it, and the
 *  formulas played so far. Once played, a stop until `next`. */
export function TutorialPanel() {
  const t = useI18n((s) => s.t)
  const busy = useCube(selectBusy)
  const steps = useCube((s) => s.steps)
  const apply = useTutorialStore((s) => s.apply)
  const undo = useTutorialStore((s) => s.undo)
  const exit = useTutorialStore((s) => s.exit)
  const next = useTutorialStore((s) => s.next)
  const played = useTutorialStore((s) => s.played).length > 0
  // Turns by hand since the step began: applying finishes it from there.
  const manual = useTutorialStore((s) => s.manual).length > 0
  const view = useTutorial()
  const { step, moves, pick, review, progress } = view
  return (
    <section aria-label={t.tutorial.button} className={`${SECTION_BOX} min-h-0`}>
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
      {step && <StepHeading step={step} progress={progress} />}
      {step && !step.comingSoon && (
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
                onClick={() => moves && apply({ key: step.key, moves }, pick)}
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
      {steps && steps.length > 0 && <StepList steps={steps} />}
    </section>
  )
}
