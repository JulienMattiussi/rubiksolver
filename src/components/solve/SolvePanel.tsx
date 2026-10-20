import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Cog } from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { tutorialFor } from '@/lib/tutorials/registry'
import { stepEnd } from '@/lib/solve/progress'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { Button } from '@/components/ui/Button'
import { SECTION_BOX, SECTION_LABEL } from '@/components/ui/styles'
import { FEATURE_ICON } from '@/components/ui/features'
import { useAutoPlan } from '@/hooks/useAutoPlan'
import { useSolveShortcuts } from '@/hooks/useSolveShortcuts'
import { useEditor } from '@/store/editorStore'
import { MethodSelect } from './MethodSelect'
import { TutorialButton } from './TutorialButton'
import { StopButton } from '@/components/controls/StopButton'
import { PlanOutline } from './PlanOutline'
import { SlowCog } from './SlowCog'
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
  // The solution computed (in a worker): until then, nothing to play.
  const ready = useAutoPlan(!home)
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
  const fold = useView((s) => s.setFolded)
  const solved = useCube(selectSolved)
  const lengths = steps ? steps.map((s) => s.moves.length) : []
  const total = lengths.reduce((n, len) => n + len, 0)
  // Within a step (some of its moves played): its buttons undo or finish it.
  const midStep =
    dispatched > 0 && dispatched < total && stepEnd(lengths, dispatched - 1) !== dispatched
  // On the home page every button shows, grayed: no puzzle to solve yet.
  const back = home || busy || dispatched === 0
  const ahead = home || busy || solved || !ready || (dispatched > 0 && dispatched >= total)
  const editing = useEditor((s) => s.mode === 'edit')
  // A puzzle with a tutorial: its button beside Solve.
  const tutorial = useCube((s) => tutorialFor(cubeShape(s.cube), s.method) !== undefined) && !home
  const wide = tutorial ? '' : 'col-span-2'
  // The solution being computed: a turning cog says so.
  const computing = !home && !solved && !ready
  useSolveShortcuts({
    enabled: !home && !editing,
    canBack: !back,
    canAhead: !ahead,
    playing: busy && solving,
    canSolve: !busy && !solved && ready,
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
          <StopButton
            onClick={pause}
            className={wide}
            title={`${t.pauseTitle} (${t.solveKeys.pause})`}
          />
        ) : (
          <Button
            variant="solve"
            onClick={() => {
              solveAll()
              // On a phone, the puzzle in sight while it plays.
              fold(true)
            }}
            disabled={home || busy || solved || !ready}
            aria-busy={computing}
            // Computing, its cog turns and it says so shortly (the whole
            // words in its tooltip): it keeps its size beside Tutorial.
            aria-label={computing ? t.computing : undefined}
            className={wide}
            title={computing ? t.computing : `${t.solve} (${t.solveKeys.solve})`}
          >
            {computing ? (
              <Cog className="size-4 motion-safe:animate-spin" aria-hidden />
            ) : (
              <FEATURE_ICON.solve className="size-4" aria-hidden />
            )}
            {computing ? t.computingShort : t.solve}
          </Button>
        )}
        {tutorial && <TutorialButton />}
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
        !steps && (
          <div className="relative flex min-h-0 flex-col">
            <PlanOutline />
            <SlowCog computing={computing} />
          </div>
        )
      )}
    </section>
  )
}
