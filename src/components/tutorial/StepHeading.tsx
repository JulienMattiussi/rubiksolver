import type { TutorialStep } from '@/lib/teach/tutorial'
import { stepName } from '@/i18n/translations'
import { useI18n } from '@/i18n/i18nStore'
import { Bolded } from './Bolded'
import { HatchedCubie } from './HatchedCubie'
import { ProgressCount } from './ProgressCount'
import { TermDemo } from './TermDemo'
import { useTutorialTexts } from './useTutorialTexts'

/** The most progress dots a heading shows (past them, the numbers of its
 *  words wear the dots' colors, ProgressCount). */
const MAX_DOTS = 12

/** A tutorial step's heading: its rank among the stages, its goal, how far
 *  it has come (dots and words), what it asks, and the hatched pieces'
 *  legend. */
export function StepHeading({
  step,
  progress,
  stages,
  hatched,
}: {
  step: TutorialStep
  /** Whether its formula moves pieces aside (not when it only turns the
   *  whole puzzle): the hatches' legend shows. */
  hatched: boolean
  /** How many stages the tutorial has. */
  stages: number
  progress: { done: number; total: number } | null
}) {
  const t = useI18n((s) => s.t)
  const tx = useTutorialTexts()
  // A word of the glossary (step 0): its words in place of a hint.
  const term = step.kind === 'term'
  const told = term ? tx.termCount : tx.progress[step.key]
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wide text-amber-300 uppercase">
        {step.stage !== undefined ? tx.stage(step.stage, stages) : tx.beforeStages}
      </p>
      <h3 className="text-sm font-semibold text-white">
        {term ? tx.glossary : (tx.titles[step.key] ?? stepName(t, step.key))}
      </h3>
      {progress && told && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-300">
          {/* A dot a piece, while they fit (a 4x4's 24 centers: the words alone). */}
          {progress.total <= MAX_DOTS ? (
            <>
              <span className="flex gap-1" aria-hidden>
                {Array.from({ length: progress.total }, (_, i) => (
                  <span
                    key={i}
                    className={`size-2 rounded-full ${i < progress.done ? 'bg-emerald-400' : 'bg-slate-600'}`}
                  />
                ))}
              </span>
              {told(progress.done, progress.total)}
            </>
          ) : (
            // Too many for dots: their colors on the numbers.
            <ProgressCount text={told(progress.done, progress.total)} {...progress} />
          )}
        </div>
      )}
      {term ? (
        <>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{tx.glossaryIntro}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">
            <Bolded text={tx.term(step.key)} />
          </p>
          {step.demo && <TermDemo turn={step.demo} />}
        </>
      ) : (
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{tx.hints[step.key]}</p>
      )}
      {hatched && (step.kind === 'pieces' || step.kind === 'figure' || step.kind === 'formula') && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <HatchedCubie className="size-6 shrink-0" />
          {tx.legendMoved}
        </p>
      )}
    </div>
  )
}
