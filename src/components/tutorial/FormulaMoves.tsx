import { describeMove } from '@/lib/app/moveGuide'
import { cubeDims, cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/moves'
import type { Cube, Move } from '@/lib/core/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { PadButton } from '@/components/controls/PadButton'
import { TURN_PAIR } from '@/components/ui/styles'

/** A formula move by move: each a pad button (a click plays it alone, as
 *  the pad's do), beside its words. */
export function FormulaMoves({
  cube,
  moves,
  disabled,
}: {
  cube: Cube
  moves: readonly Move[]
  disabled: boolean
}) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const dims = cubeDims(cube)
  const shape = cubeShape(cube)
  return (
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
                disabled={disabled}
                ghost={m.amount === 3}
              />
            </div>
            <span className="text-slate-400">{words}</span>
          </li>
        )
      })}
    </ol>
  )
}
