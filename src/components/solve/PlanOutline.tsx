import { cubeShape } from '@/lib/core/cube'
import { tellsSizes } from '@/lib/core/shape'
import { methodsFor } from '@/lib/solve/solver'
import { stepName } from '@/i18n/translations'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SECTION_LABEL } from '@/components/ui/styles'

/** The chosen method's steps before any solving: their names, and the ones
 *  most solutions skip (those leading it the cube already meets left out).
 *  Solving fills them in (StepList). */
export function PlanOutline() {
  const t = useI18n((s) => s.t)
  const cube = useCube((s) => s.cube)
  const shape = cubeShape(cube)
  const methodId = useCube((s) => s.method)
  const sizes = useCube((s) => tellsSizes(s.variant))
  const methods = methodsFor(shape)
  const method = methods.find((m) => m.id === methodId) ?? methods[0]
  if (!method) return null

  return (
    // Only its list scrolls when room is short, as the solution's (StepList).
    <div className="flex min-h-0 flex-col">
      <h2 className={`${SECTION_LABEL} mb-2`}>{t.stepsLabel}</h2>
      <ol className="-mr-2 flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-2">
        {method.outline(cube).map((step, i) => (
          <li key={step.key} className="rounded-lg bg-slate-800/40 px-2.5 py-1.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 font-medium text-slate-200">
                {i + 1}. {stepName(t, step.key, sizes)}
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
