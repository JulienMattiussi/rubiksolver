import { Fragment, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { cubeDims, cubeShape, FACE_COLOR } from '@/lib/core/cube'
import { tellsSizes } from '@/lib/core/shape'
import type { CubeColor } from '@/lib/core/types'
import { turnsWhole } from '@/lib/teach/scene'
import { formatMove } from '@/lib/core/notation'
import { solveProgress, walkFocus } from '@/lib/solve/progress'
import type { SolveStep } from '@/lib/solve/solver'
import { stepName } from '@/i18n/translations'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SECTION_LABEL } from '@/components/ui/styles'

/** The chosen method's named steps, with the cumulative total and live
 *  done / current highlighting as the solution animates. The list scrolls
 *  on its own (the rest of the panel stays put) and follows the move in
 *  focus while the solution plays. */
export function StepList({ steps }: { steps: readonly SolveStep[] }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const dispatched = useCube((s) => s.dispatched)
  const active = useCube((s) => s.active)
  const queue = useCube((s) => s.queue)
  const rewinding = useCube((s) => s.rewinding)
  const dims = useCube((s) => cubeDims(s.cube))
  const shape = useCube((s) => cubeShape(s.cube))
  const variant = useCube((s) => s.variant)
  // A step turning the whole cube only (the cube held its way first): the
  // way to hold it once turned, its frame's (yellow down, green in front).
  const sizes = tellsSizes(variant)
  const name = (c: CubeColor) => (sizes ? t.tutorialMirror.thickness[c] : t.colors[c].toLowerCase())
  const heldAs = (sizes ? t.heldAsMirror : t.heldAs)(name(FACE_COLOR.D), name(FACE_COLOR.F))

  const pending = queue.length + (active ? 1 : 0)
  const { played, focus } = walkFocus(dispatched, pending, rewinding)
  const progress = solveProgress(
    steps.map((s) => s.moves.length),
    played,
    0,
  )
  const firstOf = steps.map((_, i) => steps.slice(0, i).reduce((n, s) => n + s.moves.length, 0))
  const holding = (i: number) =>
    focus >= firstOf[i]! && focus < firstOf[i]! + steps[i]!.moves.length

  // Keep the step in focus in sight, all of it (down to its last moves) when
  // it fits, and at least its move in focus; within the list only.
  const list = useRef<HTMLOListElement>(null)
  const focused = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const box = list.current
    const move = focused.current
    if (!box || !move) return
    const step = move.closest('li') ?? move
    const offset = (el: Element) =>
      el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
    const span = (el: Element) => [offset(el), offset(el) + el.getBoundingClientRect().height]
    const [stepTop, stepBottom] = span(step) as [number, number]
    const [moveTop, moveBottom] = span(move) as [number, number]
    let top = box.scrollTop
    if (stepBottom > top + box.clientHeight) top = stepBottom - box.clientHeight
    if (stepTop < top) top = stepTop
    // A step taller than the list: from wherever its move in focus is.
    if (moveBottom > top + box.clientHeight) top = moveBottom - box.clientHeight
    if (moveTop < top) top = moveTop
    if (top !== box.scrollTop) box.scrollTo?.({ top, behavior: 'smooth' })
  }, [focus])

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className={SECTION_LABEL}>{t.stepsLabel}</h2>
        <span className="text-xs font-medium text-slate-300">
          {t.solutionCount(progress.total)}
        </span>
      </div>
      <ol ref={list} className="-mr-2 flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-2">
        {steps.map((step, i) => {
          const { done, current } = progress.steps[i]!
          return (
            <li key={i} className={stepClass(done, current)}>
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 font-medium text-slate-200">
                  {i + 1}. {stepName(t, step.key, sizes)}
                </span>
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-slate-400">
                  {done && <Check className="size-3 text-emerald-400" aria-hidden />}
                  {t.solutionCount(step.moves.length)}
                </span>
              </div>
              <p
                className={`mt-0.5 font-mono leading-relaxed text-slate-400 ${current ? 'text-[13px]' : 'text-[11px]'}`}
              >
                {turnsWhole(step.moves) ? (
                  // Its turns told as one: in focus while any of them is.
                  <span
                    ref={holding(i) ? focused : undefined}
                    className={`inline-block font-sans ${moveClass(holding(i) ? focus : firstOf[i]!, focus, played)}`}
                  >
                    {heldAs.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                ) : (
                  step.moves.map((move, k) => {
                    const at = firstOf[i]! + k
                    // The space between two moves stays outside both: a
                    // highlighted move is boxed on itself alone.
                    return (
                      <Fragment key={k}>
                        {k > 0 && ' '}
                        <span
                          ref={at === focus ? focused : undefined}
                          className={moveClass(at, focus, played)}
                          aria-current={at === focus ? 'step' : undefined}
                        >
                          {formatMove(move, labels, dims, shape)}
                        </span>
                      </Fragment>
                    )
                  })
                )}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** A step's box: the step under way a size up (what one follows) and
 *  framed, a step done grayed. */
function stepClass(done: boolean, current: boolean): string {
  const base = 'shrink-0 rounded-lg border px-2.5 py-1.5'
  if (current) return `${base} text-sm border-sky-400 bg-sky-500/10`
  if (done) return `${base} text-xs border-transparent bg-slate-800/40 text-slate-400`
  return `${base} text-xs border-transparent bg-slate-800/40`
}

/** A move's tone: the move in focus boxed, the moves played grayed. */
function moveClass(at: number, focus: number, played: number): string {
  if (at === focus) return '-mx-0.5 rounded-sm bg-sky-400 px-0.5 font-bold text-slate-950'
  if (at < played) return 'text-slate-600'
  return ''
}
