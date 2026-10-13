import { formatMove } from '@/lib/moves'
import type { PuckMove } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

/** Rotation pad of the Hockey Puck, as a star prism's: each disc a notch
 *  either way, and the slash (see PadButton). */
export function PuckPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const button = (move: PuckMove, title: string, ghost = false) => (
    <PadButton
      key={formatMove(move)}
      move={move}
      label={formatMove(move, labels)}
      title={title}
      disabled={disabled}
      ghost={ghost}
    />
  )
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-2 gap-2">
        {(['U', 'D'] as const).map((layer) => (
          <div key={layer} className={TURN_PAIR}>
            {button({ layer, steps: 1 }, t.puckTurnTitle(layer, true))}
            {button({ layer, steps: 11 }, t.puckTurnTitle(layer, false), true)}
          </div>
        ))}
        <div className={`col-span-2 ${TURN_PAIR}`}>{button({ flip: true }, t.puckSlashTitle)}</div>
      </div>
    </div>
  )
}
