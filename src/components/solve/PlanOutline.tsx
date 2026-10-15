import { cubeShape } from '@/lib/core/cube'
import { methodsFor } from '@/lib/solve/solver'
import { stepName } from '@/i18n/translations'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SECTION_LABEL } from '@/components/ui/styles'

/** The chosen method's steps before any solving: their names, and the ones
 *  most solutions skip. Solving fills them in (StepList). */
export function PlanOutline() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const methodId = useCube((s) => s.method)
  const methods = methodsFor(shape)
  const method = methods.find((m) => m.id === methodId) ?? methods[0]
  if (!method) return null

  return (
    <div>
      <h2 className={`${SECTION_LABEL} mb-2`}>{t.stepsLabel}</h2>
      <ol className="flex flex-col gap-1.5">
        {method.outline.map((step, i) => (
          <li key={step.key} className="rounded-lg bg-slate-800/40 px-2.5 py-1.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 font-medium text-slate-200">
                {i + 1}. {stepName(t, step.key)}
              </span>
              {step.optional && (
                <span className="shrink-0 whitespace-nowrap text-slate-500">{t.ifNeeded}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
