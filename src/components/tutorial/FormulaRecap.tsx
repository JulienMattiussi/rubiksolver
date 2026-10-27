import { Eye, EyeOff } from 'lucide-react'
import { cubeDims, cubeShape, solvedCube } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/notation'
import type { Turn } from '@/lib/core/types'
import { formulaExample } from '@/lib/teach/example'
import type { RecapStage, Tutorial } from '@/lib/teach/tutorial'
import { stepName } from '@/i18n/translations'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useExample } from '@/store/exampleStore'
import { useView } from '@/store/viewStore'
import { SECTION_LABEL } from '@/components/ui/styles'
import { useTutorialTexts } from './useTutorialTexts'

/** The reminder: each stage the tutorial teaches and its formulas, written
 *  in the notation chosen (the end, the « Aide-mémoire »), each with an eye
 *  showing it on the cube, on its example (see `formulaExample`), the view
 *  turned to the side held in front. */
export function FormulaRecap({ tutorial }: { tutorial: Tutorial }) {
  const t = useI18n((s) => s.t)
  const tx = useTutorialTexts()
  const labels = useI18n(selectMoveLabels)
  const cube = useCube((s) => s.cube)
  const dims = cubeDims(cube)
  const shape = cubeShape(cube)
  const write = (formula: readonly Turn[]) =>
    formula.map((m) => formatMove(m, labels, dims, shape)).join(' ')
  const busy = useCube(selectBusy)
  const shownId = useExample((s) => s.example?.id)
  const toggle = useExample((s) => s.toggle)
  const viewToward = useView((s) => s.viewToward)
  const show = (stage: RecapStage, formula: readonly Turn[], id: string) => {
    if (shownId !== id) viewToward(tutorial.frame.front(tutorial.frame.holds[0]!))
    toggle({ id, ...formulaExample(tutorial, solvedCube(shape), stage, formula) })
  }
  // A formula taught again later (the 2x2's first, for both layers) is
  // listed once, at its first stage: the later ones send back to it.
  const firstAt = new Map<string, number>()
  tutorial.recap.forEach((stage, i) =>
    stage.formulas.forEach((formula) => {
      if (!firstAt.has(write(formula))) firstAt.set(write(formula), i)
    }),
  )
  const count = firstAt.size
  // Each stage's own formulas (by their rank in it, the example's id), and
  // the stages listing those it shares (by their numbers).
  const rows = tutorial.recap.map((stage, i) => {
    const own = stage.formulas.flatMap((formula, f) =>
      firstAt.get(write(formula)) === i ? [{ formula, id: `${stage.key}/${f}` }] : [],
    )
    const earlier = stage.formulas
      .map((formula) => firstAt.get(write(formula))!)
      .filter((at) => at < i)
    const stages = [...new Set(earlier)].sort((a, b) => a - b).map((at) => at + 1)
    return { stage, own, shared: earlier.length, stages }
  })
  return (
    <div className="flex w-full flex-col gap-2 text-left">
      <h3 className={SECTION_LABEL}>{t.tutorial.recapTitle(count)}</h3>
      <ol className="flex flex-col gap-2">
        {rows.map(({ stage, own, shared, stages }, i) => (
          <li key={stage.key} className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-200">
              {i + 1}. {tx.titles[stage.key] ?? stepName(t, stage.key)}
            </span>
            {stage.formulas.length === 0 && (
              <span className="text-xs text-slate-400 italic">{t.tutorial.recapByHand}</span>
            )}
            {shared > 0 && (
              <span className="text-xs text-slate-400 italic">
                {t.tutorial.recapSame(shared, stages)}
              </span>
            )}
            {/* Each its own line: a long one wrapping reads as one. */}
            {own.map(({ formula, id }) => {
              const shown = shownId === id
              const label = shown ? t.tutorial.recapHide : t.tutorial.recapShow
              return (
                <div key={id} className="flex items-start gap-1.5">
                  <button
                    type="button"
                    onClick={() => show(stage, formula, id)}
                    disabled={busy}
                    aria-pressed={shown}
                    title={label}
                    aria-label={`${label} : ${write(formula)}`}
                    className={`shrink-0 rounded p-0.5 focus-visible:outline-2 focus-visible:outline-sky-400 disabled:opacity-40 ${
                      shown ? 'text-sky-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {shown ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                  <code
                    className={`font-mono text-sm ${shown ? 'text-sky-200' : 'text-amber-200'}`}
                  >
                    {write(formula)}
                  </code>
                </div>
              )
            })}
          </li>
        ))}
      </ol>
    </div>
  )
}
