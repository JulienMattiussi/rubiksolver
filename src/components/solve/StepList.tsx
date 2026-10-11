import { Check } from 'lucide-react'
import { cubeDims } from '@/lib/cube'
import { formatMove, formatMoves } from '@/lib/moves'
import { solveProgress } from '@/lib/progress'
import type { SolveStep } from '@/lib/solver'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SECTION_LABEL } from '@/components/ui/styles'

/** The chosen method's named steps, with the cumulative total and live
 *  done / current highlighting as the solution animates. */
export function StepList({ steps }: { steps: readonly SolveStep[] }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const stepIndex = useCube((s) => s.stepIndex)
  const active = useCube((s) => s.active)
  const queue = useCube((s) => s.queue)
  const dims = useCube((s) => cubeDims(s.cube))

  const stepName = (key: string) => (t.steps as Record<string, string>)[key] ?? key
  const dispatched = steps.slice(0, stepIndex).reduce((n, s) => n + s.moves.length, 0)
  const progress = solveProgress(
    steps.map((s) => s.moves.length),
    dispatched,
    queue.length + (active ? 1 : 0),
  )

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
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-200">
                  {i + 1}. {stepName(step.key)}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  {done && <Check className="size-3 text-emerald-400" aria-hidden />}
                  {t.solutionCount(step.moves.length)}
                </span>
              </div>
              {step.allowed && (
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {t.allowedTurns}{' '}
                  <span className="font-mono text-slate-300">
                    {step.allowed.map((m) => formatMove(m, labels, dims)).join(', ')}
                  </span>
                </p>
              )}
              <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-slate-400">
                {formatMoves(step.moves, labels, dims)}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
