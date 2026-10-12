import { formatMove } from '@/lib/moves'
import type { RainbowCorner, RainbowMove } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { SECTION_LABEL, TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

const GROUPS: readonly { key: 'rainbowFront' | 'rainbowBack'; triangles: RainbowCorner[] }[] = [
  { key: 'rainbowFront', triangles: ['U', 'D', 'L', 'R'] },
  { key: 'rainbowBack', triangles: ['u', 'd', 'l', 'r'] },
]

/** Rotation pad of the Rainbow: each triangle, a third of a turn either way,
 *  the four around the front square, then the four behind (see PadButton). */
export function RainbowPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const button = (move: RainbowMove, ghost: boolean) => (
    <PadButton
      key={formatMove(move)}
      move={move}
      label={formatMove(move, labels)}
      title={t.rainbowTurnTitle(move.triangle, move.amount === 1)}
      disabled={disabled}
      ghost={ghost}
    />
  )
  return (
    <div>
      <PadHeader />
      {GROUPS.map(({ key, triangles }) => (
        <div key={key} className="mb-2">
          <p className={`${SECTION_LABEL} mb-1`}>{t[key]}</p>
          <div className="grid grid-cols-2 gap-2">
            {triangles.map((triangle) => (
              <div key={triangle} className={TURN_PAIR}>
                {button({ triangle, amount: 1 }, false)}
                {button({ triangle, amount: 2 }, true)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
