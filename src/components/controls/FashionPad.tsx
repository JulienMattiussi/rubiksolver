import { cubeDims, cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/moves'
import { describeMove } from '@/lib/app/moveGuide'
import { turnAllowed } from '@/lib/core/turn'
import type { Face, Move } from '@/lib/core/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SECTION_LABEL, TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

/** The Fashion-V's turns, by group: its blocks (each side's column, each
 *  half), then its thin layers (H and h, b and B), which only go when their
 *  half is laid. */
const GROUPS: { key: 'blocks' | 'thin'; layers: Omit<Move, 'amount'>[] }[] = [
  {
    key: 'blocks',
    layers: (['U', 'D', 'L', 'R', 'F', 'B'] as Face[]).map((face) => ({
      face,
      depth: 2,
      wide: true,
    })),
  },
  {
    key: 'thin',
    layers: [{ face: 'U' }, { face: 'U', depth: 2 }, { face: 'D', depth: 2 }, { face: 'D' }],
  },
]

/** Rotation pad of the Fashion-V, in fan2cube's notation (fashion.ts). */
export function FashionPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const cube = useCube((s) => s.cube)
  const shape = cubeShape(cube)
  const dims = cubeDims(cube)
  const button = (move: Move, ghost: boolean) => (
    <PadButton
      key={formatMove(move, labels, dims, shape)}
      move={move}
      label={formatMove(move, labels, dims, shape)}
      title={t.describeMove(describeMove(move, shape))}
      disabled={disabled || !turnAllowed(cube, move)}
      ghost={ghost}
    />
  )
  return (
    <div>
      <PadHeader />
      {GROUPS.map(({ key, layers }) => (
        <div key={key} className="mb-3">
          <h3 className={`${SECTION_LABEL} mb-2`}>{t.fashionGroups[key]}</h3>
          <div className="grid grid-cols-2 gap-2">
            {layers.map((layer) => (
              <div
                key={formatMove({ ...layer, amount: 1 }, labels, dims, shape)}
                className={TURN_PAIR}
              >
                {button({ ...layer, amount: 1 }, false)}
                {button({ ...layer, amount: 3 }, true)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
