import { GHOST_TURNS } from '@/lib/puzzles/flat/ghost'
import { useI18n } from '@/i18n/i18nStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadHeader } from './PadHeader'
import { useTurnButton } from './useTurnButton'

/** Rotation pad of the Floppy Ghost: each side flipped over by a half turn
 *  (see PadButton), clockwise from the top. */
export function GhostPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const button = useTurnButton(disabled)
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-5 gap-2">
        {GHOST_TURNS.map((move) => (
          <div key={move.side} className={TURN_PAIR}>
            {button(move, t.ghostTurnTitle(move.side))}
          </div>
        ))}
      </div>
    </div>
  )
}
