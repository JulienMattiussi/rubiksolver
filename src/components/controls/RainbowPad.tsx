import { formatMove } from '@/lib/moves'
import type { RainbowCorner, RainbowMove } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { SECTION_LABEL, TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

type Group = {
  key: 'rainbowFront' | 'rainbowBack' | 'dinoTop' | 'dinoBottom'
  triangles: RainbowCorner[]
}
const GROUPS: readonly Group[] = [
  { key: 'rainbowFront', triangles: ['U', 'D', 'L', 'R'] },
  { key: 'rainbowBack', triangles: ['u', 'd', 'l', 'r'] },
]
/** The Dino Cube's corners, the top's then the bottom's. */
const DINO_GROUPS: readonly Group[] = [
  { key: 'dinoTop', triangles: ['L', 'U', 'l', 'u'] },
  { key: 'dinoBottom', triangles: ['D', 'R', 'd', 'r'] },
]

/** Rotation pad of the Rainbow: each triangle, a third of a turn either way,
 *  the four around the front square, then the four behind (see PadButton).
 *  The Dino Cube's (`dino`): its corners, the top's then the bottom's. */
export function RainbowPad({
  disabled,
  dino = false,
  rex = false,
}: {
  disabled: boolean
  dino?: boolean
  /** The Rex Cube's turns (the Dino's pad). */
  rex?: boolean
}) {
  const flags = rex
    ? { dino: true as const, rex: true as const }
    : dino
      ? { dino: true as const }
      : {}
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const button = (move: RainbowMove, ghost: boolean) => (
    <PadButton
      key={formatMove(move)}
      move={move}
      label={formatMove(move, labels)}
      title={
        dino || rex
          ? t.dinoTurnTitle(move.triangle, move.amount === 1)
          : t.rainbowTurnTitle(move.triangle, move.amount === 1)
      }
      disabled={disabled}
      ghost={ghost}
    />
  )
  return (
    <div>
      <PadHeader />
      {(dino || rex ? DINO_GROUPS : GROUPS).map(({ key, triangles }) => (
        <div key={key} className="mb-2">
          <p className={`${SECTION_LABEL} mb-1`}>{t[key]}</p>
          <div className="grid grid-cols-2 gap-2">
            {triangles.map((triangle) => (
              <div key={triangle} className={TURN_PAIR}>
                {button({ triangle, amount: 1, ...flags }, false)}
                {button({ triangle, amount: 2, ...flags }, true)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
