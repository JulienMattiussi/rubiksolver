import { Sparkles, StepForward } from 'lucide-react'
import { isSolved } from '@/lib/cube'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { Button } from '@/components/ui/Button'
import { MethodSelect } from './MethodSelect'
import { StepList } from './StepList'

/** "Résolution" block: method picker, solve / step-by-step, and the steps. */
export function SolvePanel() {
  const t = useI18n((s) => s.t)
  const cube = useCube((s) => s.cube)
  const solveAll = useCube((s) => s.solveAll)
  const playNextStep = useCube((s) => s.playNextStep)
  const steps = useCube((s) => s.steps)
  const stepIndex = useCube((s) => s.stepIndex)
  const active = useCube((s) => s.active)
  const queue = useCube((s) => s.queue)

  const busy = active !== null || queue.length > 0
  const solved = isSolved(cube)
  const allPlayed = steps ? stepIndex >= steps.length : false

  return (
    <div className="flex flex-col gap-3">
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
    </div>
  )
}
