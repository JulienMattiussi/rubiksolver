import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Square } from 'lucide-react'
import { stepEnd } from '@/lib/progress'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'
import { Button } from '@/components/ui/Button'
import { SECTION_BOX, SECTION_LABEL } from '@/components/ui/styles'
import { FEATURE_ICON } from '@/components/ui/features'
import { useAutoPlan } from '@/hooks/useAutoPlan'
import { useSolveShortcuts } from '@/hooks/useSolveShortcuts'
import { useEditor } from '@/store/editorStore'
import { MethodSelect } from './MethodSelect'
import { PlanOutline } from './PlanOutline'
import { StepList } from './StepList'

/** Solve block: method picker, solve (the rest at once), walk the solution
 *  both ways a step or a move at a time (the most didactic; within a step,
 *  undo or finish it), and the steps: the method's plan, then its real
 *  moves as soon as they are computed (ahead, see useAutoPlan). On the home
 *  page, no puzzle yet: a hint, and its buttons grayed. */
/** A move is a smaller stride than a step: its buttons are a size down. */
const MOVE_BUTTON = 'py-1.5 text-xs'

export function SolvePanel({ home = false }: { home?: boolean }) {
  const t = useI18n((s) => s.t)
  useAutoPlan(!home)
  const solveAll = useCube((s) => s.solveAll)
  const pause = useCube((s) => s.pause)
  const solving = useCube((s) => s.solving)
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
  // On the home page every button shows, grayed: no puzzle to solve yet.
  const back = home || busy || dispatched === 0
  const ahead = home || busy || solved || (dispatched > 0 && dispatched >= total)
  const editing = useEditor((s) => s.mode === 'edit')
  useSolveShortcuts({
    enabled: !home && !editing,
    canBack: !back,
    canAhead: !ahead,
    playing: busy && solving,
    canSolve: !busy && !solved,
    nextMove: playNextMove,
    undoMove,
    nextStep: playNextStep,
    undoStep,
    solveAll,
    pause,
  })

  return (
    // Free to shrink, so that only the step list scrolls when room is short.
    <section aria-label={t.sectionSolve} className={`${SECTION_BOX} min-h-0`}>
      {home ? (
        <div>
          <h2 className={SECTION_LABEL}>{t.methodLabel}</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{t.solveHint}</p>
        </div>
      ) : (
        <MethodSelect disabled={busy} />
      )}

      <div className="grid grid-cols-2 gap-2">
        {busy && solving ? (
          // Pauses where it stands: the move under way ends, the rest waits.
          <Button
            onClick={pause}
            className="col-span-2"
            title={`${t.pauseTitle} (${t.solveKeys.pause})`}
          >
            <Square className="size-4" aria-hidden />
            {t.stop}
          </Button>
        ) : (
          <Button
            variant="solve"
            onClick={solveAll}
            disabled={home || busy || solved}
            className="col-span-2"
            title={`${t.solve} (${t.solveKeys.solve})`}
          >
            <FEATURE_ICON.solve className="size-4" aria-hidden />
            {t.solve}
          </Button>
        )}
        <Button
          onClick={undoStep}
          disabled={back}
          title={`${midStep ? t.undoStep : t.prevStep} (${t.solveKeys.stepBack})`}
        >
          <ChevronsLeft className="size-4" aria-hidden />
          {midStep ? t.undoStep : t.prevStep}
        </Button>
        <Button
          onClick={playNextStep}
          disabled={ahead}
          title={`${midStep ? t.finishStep : t.nextStep} (${t.solveKeys.stepAhead})`}
        >
          {midStep ? t.finishStep : t.nextStep}
          <ChevronsRight className="size-4" aria-hidden />
        </Button>
        <Button
          onClick={undoMove}
          disabled={back}
          className={MOVE_BUTTON}
          title={`${t.prevMove} (${t.solveKeys.moveBack})`}
        >
          <ChevronLeft className="size-4" aria-hidden />
          {t.prevMove}
        </Button>
        <Button
          onClick={playNextMove}
          disabled={ahead}
          className={MOVE_BUTTON}
          title={`${t.nextMove} (${t.solveKeys.moveAhead})`}
        >
          {t.nextMove}
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {home ? null : steps && steps.length > 0 ? (
        <StepList steps={steps} />
      ) : (
        !steps && <PlanOutline />
      )}
    </section>
  )
}
