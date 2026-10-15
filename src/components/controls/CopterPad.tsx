import { cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/moves'
import { describeMove } from '@/lib/app/moveGuide'
import { COPTER_TURNS } from '@/lib/puzzles/diagonal/copter'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

/** Rotation pad of the Curvy Copters: each edge's half turn, the top
 *  edges, the middle ones, then the bottom ones. */
export function CopterPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const shape = useCube((s) => cubeShape(s.cube))
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-4 gap-2">
        {COPTER_TURNS.map((move) => (
          <div key={move.edge} className={TURN_PAIR}>
            <PadButton
              move={move}
              label={formatMove(move, labels)}
              title={t.describeMove(describeMove(move, shape))}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
