import type { MegaFace, MegaMove } from '@/lib/core/types'
import { useI18n } from '@/i18n/i18nStore'
import { PadGroups } from './PadGroups'
import { PadHeader } from './PadHeader'
import { useTurnButton } from './useTurnButton'

const GROUPS: readonly { key: 'megaUpper' | 'megaLower'; layers: MegaFace[] }[] = [
  { key: 'megaUpper', layers: ['U', 'F', 'R', 'L', 'BR', 'BL'] },
  { key: 'megaLower', layers: ['DR', 'DL', 'DBR', 'DBL', 'B', 'D'] },
]

/** Rotation pad of the Megaminx: each face a fifth either way (see
 *  PadButton), the top and the five around it, then the lower half. */
export function MegaPad({ disabled, crystal = false }: { disabled: boolean; crystal?: boolean }) {
  const t = useI18n((s) => s.t)
  const turnButton = useTurnButton(disabled)
  const button = (move: MegaMove, ghost: boolean) =>
    turnButton(move, t.megaTurnTitle(move.megaFace, move.amount === 1), { ghost })
  return (
    <div>
      <PadHeader />
      <PadGroups
        groups={GROUPS.map((g) => ({ ...g, title: t[g.key] }))}
        layerKey={(megaFace) => megaFace}
        pair={(megaFace) => (
          <>
            {button({ megaFace, amount: 1, ...(crystal && { crystal: true }) }, false)}
            {button({ megaFace, amount: 4, ...(crystal && { crystal: true }) }, true)}
          </>
        )}
      />
    </div>
  )
}
