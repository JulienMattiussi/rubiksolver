import type { RainbowCorner, RainbowMove } from '@/lib/core/types'
import { useI18n } from '@/i18n/i18nStore'
import { FTO_CUT, FTO_SLICE } from '@/lib/puzzles/polyhedron/fto'
import { isSliceCut } from '@/lib/puzzles/shared/rainbow'
import { PadGroups } from './PadGroups'
import { PadHeader } from './PadHeader'
import { useTurnButton } from './useTurnButton'

/** The FTO's layers (rainbow.ts, `FTO_LETTERS`): the top face and the three
 *  beside it, the bottom face and the three beside it, the four slices. */
const GROUPS: readonly {
  key: 'ftoTop' | 'ftoBottom' | 'ftoSlices'
  layers: RainbowCorner[]
  slice?: true
}[] = [
  { key: 'ftoTop', layers: ['U', 'u', 'R', 'L'] },
  { key: 'ftoBottom', layers: ['d', 'D', 'r', 'l'] },
  { key: 'ftoSlices', layers: ['U', 'u', 'r', 'l'], slice: true },
]

/** Rotation pad of the FTO: each face a third of a turn either way, then
 *  each slice (see PadButton). */
export function FtoPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const turnButton = useTurnButton(disabled)
  const button = (move: RainbowMove, ghost: boolean) =>
    turnButton(move, t.ftoTurnTitle(move.triangle, move.amount === 1, isSliceCut(move.cut)), {
      ghost,
    })
  return (
    <div>
      <PadHeader />
      <PadGroups
        groups={GROUPS.map((g) => ({ ...g, title: t[g.key] }))}
        layerKey={(triangle) => triangle}
        pair={(triangle, { slice }) => {
          const turn = { triangle, cut: slice ? FTO_SLICE : FTO_CUT }
          return (
            <>
              {button({ ...turn, amount: 1 }, false)}
              {button({ ...turn, amount: 2 }, true)}
            </>
          )
        }}
      />
    </div>
  )
}
