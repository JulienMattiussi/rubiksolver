import { cubeDims, cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/notation'
import { describeMove } from '@/lib/app/moveGuide'
import { turnAllowed } from '@/lib/core/turn'
import type { Move } from '@/lib/core/types'
import type { LayerGroup } from '@/lib/puzzles/entry'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { PadGroups } from './PadGroups'
import { PadHeader } from './PadHeader'
import { useTurnButton } from './useTurnButton'

/** Rotation pad of a puzzle whose face turns go by groups, each under its
 *  title (the Fashion-V's blocks then thin layers, Meffert's Pocket Cube's
 *  halves then the thin layers by its small corner), in its own notation
 *  (its model's `format`), a turn grayed while it jams. */
export function LayerPad({
  groups,
  disabled,
}: {
  groups: readonly LayerGroup[]
  disabled: boolean
}) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const cube = useCube((s) => s.cube)
  const shape = cubeShape(cube)
  const dims = cubeDims(cube)
  const turnButton = useTurnButton(disabled)
  const button = (move: Move, ghost: boolean) =>
    turnButton(move, t.describeMove(describeMove(move, shape)), {
      ghost,
      off: !turnAllowed(cube, move),
    })
  return (
    <div>
      <PadHeader />
      <PadGroups
        groups={groups.map((g) => ({ ...g, title: t.padGroups[g.key] }))}
        layerKey={(layer) => formatMove({ ...layer, amount: 1 }, labels, dims, shape)}
        pair={(layer) => (
          <>
            {button({ ...layer, amount: 1 }, false)}
            {button({ ...layer, amount: 3 }, true)}
          </>
        )}
      />
    </div>
  )
}
