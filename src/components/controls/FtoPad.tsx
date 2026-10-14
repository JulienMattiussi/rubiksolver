import { formatMove } from '@/lib/core/moves'
import type { RainbowCorner, RainbowMove } from '@/lib/core/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { SECTION_LABEL, TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

/** The FTO's layers (rainbow.ts, `FTO_LETTERS`): the top face and the three
 *  beside it, the bottom face and the three beside it, the four slices. */
const GROUPS: readonly {
  key: 'ftoTop' | 'ftoBottom' | 'ftoSlices'
  faces: RainbowCorner[]
  slice?: true
}[] = [
  { key: 'ftoTop', faces: ['U', 'u', 'R', 'L'] },
  { key: 'ftoBottom', faces: ['d', 'D', 'r', 'l'] },
  { key: 'ftoSlices', faces: ['U', 'u', 'r', 'l'], slice: true },
]

/** Rotation pad of the FTO: each face a third of a turn either way, then
 *  each slice (see PadButton). */
export function FtoPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const button = (move: RainbowMove, ghost: boolean) => (
    <PadButton
      key={formatMove(move)}
      move={move}
      label={formatMove(move, labels)}
      title={t.ftoTurnTitle(move.triangle, move.amount === 1, !!move.slice)}
      disabled={disabled}
      ghost={ghost}
    />
  )
  return (
    <div>
      <PadHeader />
      {GROUPS.map(({ key, faces, slice }) => (
        <div key={key} className="mb-2">
          <p className={`${SECTION_LABEL} mb-1`}>{t[key]}</p>
          <div className="grid grid-cols-2 gap-2">
            {faces.map((triangle) => {
              const turn = { triangle, fto: true as const, ...(slice && { slice }) }
              return (
                <div key={triangle} className={TURN_PAIR}>
                  {button({ ...turn, amount: 1 }, false)}
                  {button({ ...turn, amount: 2 }, true)}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
