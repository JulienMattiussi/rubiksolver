import type { TutorialStep } from '@/lib/tutorial/tutorial'
import { stepName } from '@/i18n/translations'
import { useI18n } from '@/i18n/i18nStore'
import { HatchedCubie } from './HatchedCubie'

/** A tutorial step's heading: its rank among the stages, its goal, how far
 *  it has come (dots and words), what it asks, and the hatched pieces'
 *  legend. */
export function StepHeading({
  step,
  progress,
  stages,
}: {
  step: TutorialStep
  /** How many stages the tutorial has. */
  stages: number
  progress: { done: number; total: number } | null
}) {
  const t = useI18n((s) => s.t)
  const told = t.tutorial.progress[step.key]
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wide text-amber-300 uppercase">
        {step.stage ? t.tutorial.stage(step.stage, stages) : t.tutorial.beforeStages}
      </p>
      <h3 className="text-sm font-semibold text-white">
        {t.tutorial.titles[step.key] ?? stepName(t, step.key)}
      </h3>
      {progress && told && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-300">
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: progress.total }, (_, i) => (
              <span
                key={i}
                className={`size-2 rounded-full ${i < progress.done ? 'bg-emerald-400' : 'bg-slate-600'}`}
              />
            ))}
          </span>
          {told(progress.done, progress.total)}
        </div>
      )}
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{t.tutorial.hints[step.key]}</p>
      {!step.comingSoon && !step.alreadyDone && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <HatchedCubie className="size-6 shrink-0" />
          {t.tutorial.legendMoved}
        </p>
      )}
    </div>
  )
}
