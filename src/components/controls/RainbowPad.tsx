import { formatMove } from '@/lib/core/moves'
import type { RainbowCorner, RainbowMove } from '@/lib/core/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { SECTION_LABEL, TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

type Group = {
  key: 'rainbowFront' | 'rainbowBack' | 'dinoTop' | 'dinoBottom' | 'masterSlices'
  triangles: RainbowCorner[]
  /** A Master Skewb's inner slices. */
  slice?: true
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

/** The Master Skewb's: the Dino's corners, then its inner slices (named
 *  by their bottom corner). */
const MASTER_GROUPS: readonly Group[] = [
  ...DINO_GROUPS,
  { key: 'masterSlices', triangles: ['D', 'R', 'd', 'r'], slice: true },
]

/** Rotation pad of the Rainbow: each triangle, a third of a turn either way,
 *  the four around the front square, then the four behind (see PadButton).
 *  The Dino Cube's (`dino`): its corners, the top's then the bottom's; the
 *  Master Skewb's (`master`) then its inner slices. */
export function RainbowPad({
  disabled,
  dino = false,
  rex = false,
  skewb = false,
  master = false,
}: {
  disabled: boolean
  dino?: boolean
  /** The Rex Cube's turns (the Dino's pad). */
  rex?: boolean
  /** The Skewb Ultimate's turns (the Dino's pad). */
  skewb?: boolean
  /** The Master Skewb's turns (the Dino's pad, and its inner slices). */
  master?: boolean
}) {
  const flags = master
    ? { dino: true as const, master: true as const }
    : skewb
      ? { dino: true as const, skewb: true as const }
      : rex
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
        move.master && move.slice
          ? t.masterSliceTitle(move.triangle, move.amount === 1)
          : dino || rex || skewb || master
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
      {(master ? MASTER_GROUPS : dino || rex || skewb ? DINO_GROUPS : GROUPS).map(
        ({ key, triangles, slice }) => (
          <div key={key} className="mb-2">
            <p className={`${SECTION_LABEL} mb-1`}>{t[key]}</p>
            <div className="grid grid-cols-2 gap-2">
              {triangles.map((triangle) => (
                <div key={triangle} className={TURN_PAIR}>
                  {button({ triangle, amount: 1, ...flags, ...(slice && { slice }) }, false)}
                  {button({ triangle, amount: 2, ...flags, ...(slice && { slice }) }, true)}
                </div>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  )
}
