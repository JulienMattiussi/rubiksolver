import { Sparkles, StepForward } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'
import { Button } from '@/components/ui/Button'
import { SECTION_BOX } from '@/components/ui/styles'
import { MethodSelect } from './MethodSelect'
import { StepList } from './StepList'

/** Solve block: method picker, solve / step-by-step, and the steps. */
export function SolvePanel() {
  const t = useI18n((s) => s.t)
  const solveAll = useCube((s) => s.solveAll)
  const playNextStep = useCube((s) => s.playNextStep)
  const steps = useCube((s) => s.steps)
  const stepIndex = useCube((s) => s.stepIndex)
  const busy = useCube(selectBusy)
  const solved = useCube(selectSolved)
  const allPlayed = steps ? stepIndex >= steps.length : false

  return (
    <section aria-label={t.sectionSolve} className={SECTION_BOX}>
      <MethodSelect disabled={busy} />

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

      {steps && steps.length > 0 && <StepList steps={steps} />}
    </section>
  )
}
