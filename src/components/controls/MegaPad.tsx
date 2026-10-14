import { formatMove } from '@/lib/moves'
import type { MegaFace, MegaMove } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { SECTION_LABEL, TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

const GROUPS: readonly { key: 'megaUpper' | 'megaLower'; faces: MegaFace[] }[] = [
  { key: 'megaUpper', faces: ['U', 'F', 'R', 'L', 'BR', 'BL'] },
  { key: 'megaLower', faces: ['DR', 'DL', 'DBR', 'DBL', 'B', 'D'] },
]

/** Rotation pad of the Megaminx: each face a fifth either way (see
 *  PadButton), the top and the five around it, then the lower half. */
export function MegaPad({ disabled, crystal = false }: { disabled: boolean; crystal?: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const button = (move: MegaMove, ghost: boolean) => (
    <PadButton
      move={move}
      label={formatMove(move, labels)}
      title={t.megaTurnTitle(move.megaFace, move.amount === 1)}
      disabled={disabled}
      ghost={ghost}
    />
  )
  return (
    <div>
      <PadHeader />
      {GROUPS.map(({ key, faces }) => (
        <div key={key} className="mb-2">
          <p className={`${SECTION_LABEL} mb-1`}>{t[key]}</p>
          <div className="grid grid-cols-2 gap-2">
            {faces.map((megaFace) => (
              <div key={megaFace} className={TURN_PAIR}>
                {button({ megaFace, amount: 1, ...(crystal && { crystal: true }) }, false)}
                {button({ megaFace, amount: 4, ...(crystal && { crystal: true }) }, true)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
