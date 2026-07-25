import { Check, Sparkles, StepForward } from 'lucide-react'
import { isSolved } from '@/lib/cube'
import { formatMoves, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import type { MethodId } from '@/lib/solver'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { Button } from './ui/Button'

const METHOD_IDS: readonly MethodId[] = ['beginner', 'cfop']

/** Method picker + solve controls + the chosen method's named steps. */
export function SolvePanel() {
  const t = useI18n((s) => s.t)
  const cube = useCube((s) => s.cube)
  const method = useCube((s) => s.method)
  const setMethod = useCube((s) => s.setMethod)
  const solveAll = useCube((s) => s.solveAll)
  const playNextStep = useCube((s) => s.playNextStep)
  const notation = useI18n((s) => s.notation)
  const steps = useCube((s) => s.steps)
  const stepIndex = useCube((s) => s.stepIndex)
  const active = useCube((s) => s.active)
  const queue = useCube((s) => s.queue)

  const busy = active !== null || queue.length > 0
  const solved = isSolved(cube)
  const labels = notation === 'fr' ? NOTATION_FR : NOTATION_US
  const stepName = (key: string) => (t.steps as Record<string, string>)[key] ?? key

  // Moves already sent to the queue (only the steps that have been started),
  // minus those still waiting: that is how many turns have actually animated.
  const dispatched = steps ? steps.slice(0, stepIndex).reduce((n, s) => n + s.moves.length, 0) : 0
  const consumed = dispatched - (queue.length + (active ? 1 : 0))
  const allPlayed = steps ? stepIndex >= steps.length : false
  const totalMoves = steps ? steps.reduce((n, s) => n + s.moves.length, 0) : 0

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="method"
          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          {t.methodLabel}
        </label>
        <select
          id="method"
          value={method}
          disabled={busy}
          onChange={(e) => setMethod(e.target.value as MethodId)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:border-slate-500 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          {METHOD_IDS.map((id) => (
            <option key={id} value={id}>
              {t.methods[id].name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{t.methods[method].desc}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={solveAll} disabled={busy || solved}>
          <Sparkles className="size-4" aria-hidden />
          {t.solve}
        </Button>
        <Button onClick={playNextStep} disabled={busy || solved || allPlayed}>
          <StepForward className="size-4" aria-hidden />
          {steps ? t.nextStep : t.stepByStep}
        </Button>
      </div>

      {steps && steps.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t.stepsLabel}
            </h2>
            <span className="text-xs font-medium text-slate-300">
              {t.solutionCount(totalMoves)}
            </span>
          </div>
          <ol className="flex flex-col gap-1.5">
            {steps.map((step, i) => {
              const start = steps.slice(0, i).reduce((n, s) => n + s.moves.length, 0)
              const end = start + step.moves.length
              const done = consumed >= end
              const current = busy && consumed >= start && consumed < end
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
                  <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-slate-400">
                    {formatMoves([...step.moves], labels)}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
