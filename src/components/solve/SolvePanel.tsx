import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react'
import { stepEnd } from '@/lib/progress'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'
import { Button } from '@/components/ui/Button'
import { SECTION_BOX } from '@/components/ui/styles'
import { useAutoPlan } from '@/hooks/useAutoPlan'
import { MethodSelect } from './MethodSelect'
import { PlanOutline } from './PlanOutline'
import { StepList } from './StepList'

/** Solve block: method picker, solve (the rest at once), walk the solution
 *  both ways a step or a move at a time (the most didactic; within a step,
 *  undo or finish it), and the steps: the method's plan, then its real
 *  moves as soon as they are computed (ahead, see useAutoPlan). */
/** A move is a smaller stride than a step: its buttons are a size down. */
const MOVE_BUTTON = 'py-1.5 text-xs'

export function SolvePanel() {
  const t = useI18n((s) => s.t)
  useAutoPlan()
  const solveAll = useCube((s) => s.solveAll)
  const playNextStep = useCube((s) => s.playNextStep)
  const playNextMove = useCube((s) => s.playNextMove)
  const undoStep = useCube((s) => s.undoStep)
  const undoMove = useCube((s) => s.undoMove)
  const steps = useCube((s) => s.steps)
  const dispatched = useCube((s) => s.dispatched)
  const busy = useCube(selectBusy)
  const solved = useCube(selectSolved)
  const lengths = steps ? steps.map((s) => s.moves.length) : []
  const total = lengths.reduce((n, len) => n + len, 0)
  // Within a step (some of its moves played): its buttons undo or finish it.
  const midStep =
    dispatched > 0 && dispatched < total && stepEnd(lengths, dispatched - 1) !== dispatched
  const back = busy || dispatched === 0
  const ahead = busy || solved || (dispatched > 0 && dispatched >= total)

  return (
    <section aria-label={t.sectionSolve} className={SECTION_BOX}>
      <MethodSelect disabled={busy} />

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="primary"
          onClick={solveAll}
          disabled={busy || solved}
          className="col-span-2"
        >
          <Sparkles className="size-4" aria-hidden />
          {t.solve}
        </Button>
        <Button onClick={undoStep} disabled={back}>
          <ChevronsLeft className="size-4" aria-hidden />
          {midStep ? t.undoStep : t.prevStep}
        </Button>
        <Button onClick={playNextStep} disabled={ahead}>
          {midStep ? t.finishStep : t.nextStep}
          <ChevronsRight className="size-4" aria-hidden />
        </Button>
        <Button onClick={undoMove} disabled={back} className={MOVE_BUTTON}>
          <ChevronLeft className="size-4" aria-hidden />
          {t.prevMove}
        </Button>
        <Button onClick={playNextMove} disabled={ahead} className={MOVE_BUTTON}>
          {t.nextMove}
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {steps && steps.length > 0 ? <StepList steps={steps} /> : !steps && <PlanOutline />}
    </section>
  )
}
