import { formatMove } from '@/lib/moves'
import type { Face, GearMove } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/** Rotation pad of the Gear Cubes: each face a half turn either way, its
 *  opposite face held and the slice between a quarter along (see PadButton). */
export function GearPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const button = (move: GearMove, ghost: boolean) => (
    <PadButton
      key={formatMove(move)}
      move={move}
      label={formatMove(move, labels)}
      title={t.gearTurnTitle(t.faceNames[move.gear], move.amount === 1)}
      disabled={disabled}
      ghost={ghost}
    />
  )
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-3 gap-2">
        {FACES.map((gear) => (
          <div key={gear} className={TURN_PAIR}>
            {button({ gear, amount: 1 }, false)}
            {button({ gear, amount: 3 }, true)}
          </div>
        ))}
      </div>
    </div>
  )
}
