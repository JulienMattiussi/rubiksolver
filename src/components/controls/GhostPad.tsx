import { formatMove } from '@/lib/core/moves'
import { GHOST_TURNS } from '@/lib/puzzles/flat/ghost'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

/** Rotation pad of the Floppy Ghost: each side flipped over by a half turn
 *  (see PadButton), clockwise from the top. */
export function GhostPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-5 gap-2">
        {GHOST_TURNS.map((move) => (
          <div key={move.side} className={TURN_PAIR}>
            <PadButton
              move={move}
              label={formatMove(move, labels)}
              title={t.ghostTurnTitle(move.side)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
