import { ArrowRight, Check, GraduationCap, Sparkles, Undo2, X } from 'lucide-react'
import { cubeDims, cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/moves'
import { describeMove } from '@/lib/app/moveGuide'
import { stepName } from '@/i18n/translations'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { useView } from '@/store/viewStore'
import { useTutorial } from '@/hooks/useTutorial'
import { Button } from '@/components/ui/Button'
import { SECTION_BOX, SECTION_LABEL, TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from '@/components/controls/PadButton'
import { HatchedCubie } from './HatchedCubie'
import { Toned } from './Toned'
import { StepList } from '@/components/solve/StepList'
import { COLOR_HEX, HATCH, HIGHLIGHT, PLACE } from '@/three/core/colors'

/** In place of the solve block while the tutorial is on: its step and what
 *  it asks, then its instructions numbered (hold the puzzle, spot the
 *  pieces by their tones, play the formula, see where they went), applying
 *  the formula or undoing it, and the formulas played so far. Once played,
 *  a stop: the instructions done but the last, until `next`. */
export function TutorialPanel() {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const busy = useCube(selectBusy)
  const steps = useCube((s) => s.steps)
  const apply = useTutorialStore((s) => s.apply)
  const undo = useTutorialStore((s) => s.undo)
  const played = useTutorialStore((s) => s.played)
  // Turns by hand since the step began: applying finishes it from there.
  const manual = useTutorialStore((s) => s.manual).length > 0
  const exit = useTutorialStore((s) => s.exit)
  const next = useTutorialStore((s) => s.next)
  const { cube, review, progress, step, moves, pick } = useTutorial()
  const viewToward = useView((s) => s.viewToward)
  // Where the center to face stands: the view turns toward it.
  const frontNormal = step
    ? cube.find((c) => c.stickers.length === 1 && c.stickers[0]!.color === step.front)?.stickers[0]!
        .normal
    : undefined
  const dims = cubeDims(cube)
  const shape = cubeShape(cube)
  // A piece named by its colors, the marker's first (the yellow edge's).
  const pieceName = (index: number) => {
    const stickers = cube[index]!.stickers
    const colors = [...stickers]
      .sort((a, b) => Number(b.color === step?.marker) - Number(a.color === step?.marker))
      .map((s) => t.colors[s.color].toLowerCase())
      .join('-')
    return t.tutorial.piece(stickers.length, colors)
  }
  const occupant = pick
    ? cube.findIndex((c, i) => i !== pick.piece && c.position.join() === pick.slot.join())
    : -1
  // The step's instructions, numbered: hold the puzzle, spot the pieces,
  // play the formula, see where the pieces went.
  const instructions =
    step && !step.comingSoon
      ? [
          // A click turns the view so: the formula reads from there.
          <button
            key="hold"
            type="button"
            onClick={() => frontNormal && viewToward(frontNormal)}
            title={t.tutorial.facingTitle}
            className="rounded text-left underline decoration-dotted underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <Toned colors={[COLOR_HEX[step.front]]}>
              {t.tutorial.facing(t.colors[step.front].toLowerCase())}
            </Toned>
          </button>,
          ...(pick
            ? [
                <Toned key="spot" colors={occupant >= 0 ? [HIGHLIGHT, PLACE] : [HIGHLIGHT]}>
                  {occupant >= 0
                    ? t.tutorial.spotSwap(pieceName(pick.piece), pieceName(occupant))
                    : t.tutorial.spot(pieceName(pick.piece))}
                </Toned>,
              ]
            : []),
          moves ? (
            <>
              {t.tutorial.play(moves.length)}
              {/* The formula move by move, each a pad button (a click plays
                  it alone) beside its words. */}
              <ol className="mt-1.5 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
                {moves.map((m, i) => {
                  const words = t.describeMoveShort(describeMove(m, shape))
                  return (
                    <li key={i} className="contents">
                      <div className={`${TURN_PAIR} w-12`}>
                        <PadButton
                          move={m}
                          label={formatMove(m, labels, dims, shape)}
                          title={words}
                          disabled={busy || review}
                          ghost={m.amount === 3}
                        />
                      </div>
                      <span className="text-slate-400">{words}</span>
                    </li>
                  )
                })}
              </ol>
            </>
          ) : (
            t.tutorial.noFormula
          ),
          <Toned key="check" colors={[HATCH]}>
            {pick ? t.tutorial.check(pieceName(pick.piece)) : t.tutorial.checkAll}
          </Toned>,
        ]
      : []
  return (
    <section aria-label={t.tutorial.button} className={`${SECTION_BOX} min-h-0`}>
      <div className="flex items-center justify-between">
        <h2 className={`${SECTION_LABEL} flex items-center gap-2`}>
          <GraduationCap className="size-4" aria-hidden />
          {t.tutorial.button}
        </h2>
        <button
          type="button"
          onClick={exit}
          title={t.tutorial.exit}
          aria-label={t.tutorial.exit}
          className="rounded p-1 text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {step && (
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-amber-300 uppercase">
            {step.stage ? t.tutorial.stage(step.stage) : t.tutorial.beforeStages}
          </p>
          <h3 className="text-sm font-semibold text-white">
            {t.tutorial.titles[step.key] ?? stepName(t, step.key)}
          </h3>
          {progress && t.tutorial.progress[step.key] && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-300">
              <span className="flex gap-1" aria-hidden>
                {Array.from({ length: progress.total }, (_, i) => (
                  <span
                    key={i}
                    className={`size-2 rounded-full ${i < progress.done ? 'bg-emerald-400' : 'bg-slate-600'}`}
                  />
                ))}
              </span>
              {t.tutorial.progress[step.key]!(progress.done, progress.total)}
            </div>
          )}
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {t.tutorial.hints[step.key]}
          </p>
          {!step.comingSoon && (
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <HatchedCubie className="size-6 shrink-0" />
              {t.tutorial.legendMoved}
            </p>
          )}
        </div>
      )}
      {step && !step.comingSoon && (
        <>
          <ol className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
            {instructions.map((text, i) => {
              // Played: the instructions done, the last (look) to do.
              const done = review && i < instructions.length - 1
              const now = review && !done
              return (
                <li key={i} className={`flex gap-2 ${done ? 'opacity-50' : ''}`}>
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${now ? 'bg-amber-500' : 'bg-slate-700'}`}
                    aria-hidden
                  >
                    {done ? <Check className="size-3" /> : i + 1}
                  </span>
                  <div className={`min-w-0 ${now ? 'text-white' : ''}`}>{text}</div>
                </li>
              )
            })}
          </ol>
          <div className="grid grid-cols-2 gap-2">
            {review ? (
              <Button variant="solve" onClick={next} disabled={busy} className="col-span-2">
                <ArrowRight className="size-4" aria-hidden />
                {t.tutorial.next}
              </Button>
            ) : (
              <Button
                variant="solve"
                onClick={() => moves && apply({ key: step.key, moves }, pick)}
                disabled={busy || !moves || (moves.length === 0 && !manual)}
                className="col-span-2"
              >
                <Sparkles className="size-4" aria-hidden />
                {manual ? t.tutorial.finish : t.tutorial.apply}
              </Button>
            )}
            <Button
              onClick={undo}
              disabled={busy || (played.length === 0 && !manual)}
              className="col-span-2"
            >
              <Undo2 className="size-4" aria-hidden />
              {t.tutorial.undo}
            </Button>
          </div>
        </>
      )}
      {steps && steps.length > 0 && <StepList steps={steps} />}
    </section>
  )
}
