import { formatMove } from '@/lib/core/moves'
import type { RainbowCorner, RainbowMove } from '@/lib/core/types'
import type { PadKind } from '@/lib/puzzles/entry'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { PadButton } from './PadButton'
import { PadGroups } from './PadGroups'
import { PadHeader } from './PadHeader'

type Group = {
  key: 'rainbowFront' | 'rainbowBack' | 'dinoTop' | 'dinoBottom' | 'masterSlices'
  layers: RainbowCorner[]
  /** A Master Skewb's inner slices. */
  slice?: true
}
const RAINBOW_GROUPS: readonly Group[] = [
  { key: 'rainbowFront', layers: ['U', 'D', 'L', 'R'] },
  { key: 'rainbowBack', layers: ['u', 'd', 'l', 'r'] },
]
/** The Dino Cube's corners, the top's then the bottom's. */
const DINO_GROUPS: readonly Group[] = [
  { key: 'dinoTop', layers: ['L', 'U', 'l', 'u'] },
  { key: 'dinoBottom', layers: ['D', 'R', 'd', 'r'] },
]

/** The Master Skewb's: the Dino's corners, then its inner slices (named
 *  by their bottom corner). */
const MASTER_GROUPS: readonly Group[] = [
  ...DINO_GROUPS,
  { key: 'masterSlices', layers: ['D', 'R', 'd', 'r'], slice: true },
]

/** The puzzles turning the Rainbow's way, each with its own pad. */
type RainbowVariant = Extract<PadKind, 'rainbow' | 'dino' | 'rex' | 'skewb' | 'masterSkewb'>

/** Each variant's groups and the flags its turns carry: the Rex Cube, the
 *  Skewb Ultimate and the Master Skewb turn as the Dino Cube does. */
const VARIANTS: Record<
  RainbowVariant,
  { groups: readonly Group[]; flags: Omit<RainbowMove, 'triangle' | 'amount'> }
> = {
  rainbow: { groups: RAINBOW_GROUPS, flags: {} },
  dino: { groups: DINO_GROUPS, flags: { dino: true } },
  rex: { groups: DINO_GROUPS, flags: { dino: true, rex: true } },
  skewb: { groups: DINO_GROUPS, flags: { dino: true, skewb: true } },
  masterSkewb: { groups: MASTER_GROUPS, flags: { dino: true, master: true } },
}

/** Rotation pad of the Rainbow: each triangle, a third of a turn either way,
 *  the four around the front square, then the four behind (see PadButton).
 *  The Dino Cube's: its corners, the top's then the bottom's; the Master
 *  Skewb's then its inner slices. */
export function RainbowPad({ disabled, variant }: { disabled: boolean; variant: RainbowVariant }) {
  const { groups, flags } = VARIANTS[variant]
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const titleOf = (move: RainbowMove) => {
    const clockwise = move.amount === 1
    if (move.master && move.slice) return t.masterSliceTitle(move.triangle, clockwise)
    if (move.dino) return t.dinoTurnTitle(move.triangle, clockwise)
    return t.rainbowTurnTitle(move.triangle, clockwise)
  }
  const button = (move: RainbowMove, ghost: boolean) => (
    <PadButton
      key={formatMove(move)}
      move={move}
      label={formatMove(move, labels)}
      title={titleOf(move)}
      disabled={disabled}
      ghost={ghost}
    />
  )
  return (
    <div>
      <PadHeader />
      <PadGroups
        groups={groups.map((g) => ({ ...g, title: t[g.key] }))}
        layerKey={(triangle) => triangle}
        pair={(triangle, { slice }) => (
          <>
            {button({ triangle, amount: 1, ...flags, ...(slice && { slice }) }, false)}
            {button({ triangle, amount: 2, ...flags, ...(slice && { slice }) }, true)}
          </>
        )}
      />
    </div>
  )
}
