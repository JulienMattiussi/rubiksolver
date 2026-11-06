import type { RainbowCorner, RainbowCut, RainbowMove } from '@/lib/core/types'
import type { PadKind } from '@/lib/puzzles/entry'
import { DINO_CUT, REX_CUT } from '@/lib/puzzles/shared/dinoRex'
import { RAINBOW_CUT } from '@/lib/puzzles/shared/rainbow'
import { MASTER_CUTS, SKEWB_CUT } from '@/lib/puzzles/shared/skewbs'
import { useI18n } from '@/i18n/i18nStore'
import { PadGroups } from './PadGroups'
import { PadHeader } from './PadHeader'
import { useTurnButton } from './useTurnButton'

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

/** The Ivy Cube's four corners, the top's then the bottom's. */
const IVY_GROUPS: readonly Group[] = [
  { key: 'dinoTop', layers: ['L', 'u'] },
  { key: 'dinoBottom', layers: ['R', 'd'] },
]

/** The Master Skewb's: the Dino's corners, then its inner slices (named
 *  by their bottom corner). */
const MASTER_GROUPS: readonly Group[] = [
  ...DINO_GROUPS,
  { key: 'masterSlices', layers: ['D', 'R', 'd', 'r'], slice: true },
]

/** The puzzles turning the Rainbow's way, each with its own pad. */
type RainbowVariant = Extract<PadKind, 'rainbow' | 'dino' | 'rex' | 'skewb' | 'ivy' | 'masterSkewb'>

/** Each variant's groups and the cuts its turns take (its slices' too),
 *  and whether they are named by corner (the Dino Cube and those cut
 *  from it) rather than by triangle (the Rainbow). */
const VARIANTS: Record<
  RainbowVariant,
  { groups: readonly Group[]; cut: RainbowCut; slice?: RainbowCut; corners?: true }
> = {
  rainbow: { groups: RAINBOW_GROUPS, cut: RAINBOW_CUT },
  dino: { groups: DINO_GROUPS, cut: DINO_CUT, corners: true },
  rex: { groups: DINO_GROUPS, cut: REX_CUT, corners: true },
  skewb: { groups: DINO_GROUPS, cut: SKEWB_CUT, corners: true },
  ivy: { groups: IVY_GROUPS, cut: SKEWB_CUT, corners: true },
  masterSkewb: {
    groups: MASTER_GROUPS,
    cut: MASTER_CUTS.corner,
    slice: MASTER_CUTS.slice,
    corners: true,
  },
}

/** Rotation pad of the Rainbow: each triangle, a third of a turn either way,
 *  the four around the front square, then the four behind (see PadButton).
 *  The Dino Cube's: its corners, the top's then the bottom's; the Master
 *  Skewb's then its inner slices. */
export function RainbowPad({ disabled, variant }: { disabled: boolean; variant: RainbowVariant }) {
  const { groups, cut, slice: sliceCut, corners } = VARIANTS[variant]
  const t = useI18n((s) => s.t)
  const turnButton = useTurnButton(disabled)
  const titleOf = (move: RainbowMove, slice?: true) => {
    const clockwise = move.amount === 1
    if (slice) return t.masterSliceTitle(move.triangle, clockwise)
    if (corners) return t.dinoTurnTitle(move.triangle, clockwise)
    return t.rainbowTurnTitle(move.triangle, clockwise)
  }
  const button = (move: RainbowMove, ghost: boolean, slice?: true) =>
    turnButton(move, titleOf(move, slice), { ghost })
  return (
    <div>
      <PadHeader />
      <PadGroups
        groups={groups.map((g) => ({ ...g, title: t[g.key] }))}
        layerKey={(triangle) => triangle}
        pair={(triangle, { slice }) => (
          <>
            {button({ triangle, amount: 1, cut: slice ? sliceCut! : cut }, false, slice)}
            {button({ triangle, amount: 2, cut: slice ? sliceCut! : cut }, true, slice)}
          </>
        )}
      />
    </div>
  )
}
