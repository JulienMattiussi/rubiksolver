import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { cubeDims } from '@/lib/cube'
import { formatMove } from '@/lib/moves'
import { solveProgress, walkFocus } from '@/lib/progress'
import type { SolveStep } from '@/lib/solver'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SECTION_LABEL } from '@/components/ui/styles'

/** The chosen method's named steps, with the cumulative total and live
 *  done / current highlighting as the solution animates. */
export function StepList({ steps }: { steps: readonly SolveStep[] }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const dispatched = useCube((s) => s.dispatched)
  const active = useCube((s) => s.active)
  const queue = useCube((s) => s.queue)
  const rewinding = useCube((s) => s.rewinding)
  const dims = useCube((s) => cubeDims(s.cube))

  const stepName = (key: string) => (t.steps as Record<string, string>)[key] ?? key
  const pending = queue.length + (active ? 1 : 0)
  const { played, focus } = walkFocus(dispatched, pending, rewinding)
  const progress = solveProgress(
    steps.map((s) => s.moves.length),
    played,
    0,
  )
  const firstOf = steps.map((_, i) => steps.slice(0, i).reduce((n, s) => n + s.moves.length, 0))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className={SECTION_LABEL}>{t.stepsLabel}</h2>
        <span className="text-xs font-medium text-slate-300">
          {t.solutionCount(progress.total)}
        </span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {steps.map((step, i) => {
          const { done, current } = progress.steps[i]!
          return (
            <li
              key={i}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                current
                  ? 'border-sky-400 bg-sky-500/10'
                  : done
                    ? 'border-transparent bg-slate-800/40 text-slate-400'
                    : 'border-transparent bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 font-medium text-slate-200">
                  {i + 1}. {stepName(step.key)}
                </span>
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-slate-400">
                  {done && <Check className="size-3 text-emerald-400" aria-hidden />}
                  {t.solutionCount(step.moves.length)}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-slate-400">
                {step.moves.map((move, k) => {
                  const at = firstOf[i]! + k
                  const tone =
                    at === focus
                      ? '-mx-0.5 rounded-sm bg-sky-400 px-0.5 font-bold text-slate-950'
                      : at < played
                        ? 'text-slate-600'
                        : ''
                  // The space between two moves stays outside both: a
                  // highlighted move is boxed on itself alone.
                  return (
                    <Fragment key={k}>
                      {k > 0 && ' '}
                      <span className={tone} aria-current={at === focus ? 'step' : undefined}>
                        {formatMove(move, labels, dims)}
                      </span>
                    </Fragment>
                  )
                })}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
