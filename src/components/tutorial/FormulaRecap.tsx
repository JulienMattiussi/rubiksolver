import { cubeDims, cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/notation'
import type { Turn } from '@/lib/core/types'
import type { Tutorial } from '@/lib/teach/tutorial'
import { stepName } from '@/i18n/translations'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SECTION_LABEL } from '@/components/ui/styles'
import { useTutorialTexts } from './useTutorialTexts'

/** The reminder: each stage the tutorial teaches and its formulas, written
 *  in the notation chosen, to read only (the end, the « Aide-mémoire »). */
export function FormulaRecap({ tutorial }: { tutorial: Tutorial }) {
  const t = useI18n((s) => s.t)
  const tx = useTutorialTexts()
  const labels = useI18n(selectMoveLabels)
  const cube = useCube((s) => s.cube)
  const dims = cubeDims(cube)
  const shape = cubeShape(cube)
  const write = (formula: readonly Turn[]) =>
    formula.map((m) => formatMove(m, labels, dims, shape)).join(' ')
  // A formula taught again later (the 2x2's first, for both layers) counts once.
  const count = new Set(tutorial.recap.flatMap((stage) => stage.formulas.map(write))).size
  return (
    <div className="flex w-full flex-col gap-2 text-left">
      <h3 className={SECTION_LABEL}>{t.tutorial.recapTitle(count)}</h3>
      <ol className="flex flex-col gap-2">
        {tutorial.recap.map((stage, i) => (
          <li key={stage.key} className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-200">
              {i + 1}. {tx.titles[stage.key] ?? stepName(t, stage.key)}
            </span>
            {stage.formulas.length === 0 ? (
              <span className="text-xs text-slate-400 italic">{t.tutorial.recapByHand}</span>
            ) : (
              // Each its own bullet: a long one wrapping reads as one.
              stage.formulas.map((formula) => (
                <div key={write(formula)} className="flex gap-1.5">
                  <span className="text-slate-500" aria-hidden>
                    •
                  </span>
                  <code className="font-mono text-sm text-amber-200">{write(formula)}</code>
                </div>
              ))
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
