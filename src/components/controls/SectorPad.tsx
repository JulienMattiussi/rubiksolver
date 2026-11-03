import { turnAllowed } from '@/lib/core/turn'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadHeader } from './PadHeader'
import { useTurnButton } from './useTurnButton'

/** Rotation pad of the Hockey Puck and the Square-1, as a star prism's:
 *  each disc a notch either way, and the slash (see PadButton), grayed while
 *  it jams (a Square-1's corner across its cut). */
export function SectorPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const cube = useCube((s) => s.cube)
  const button = useTurnButton(disabled)
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-2 gap-2">
        {(['U', 'D'] as const).map((layer) => (
          <div key={layer} className={TURN_PAIR}>
            {button({ layer, steps: 1 }, t.sectorTurnTitle(layer, true))}
            {button({ layer, steps: 11 }, t.sectorTurnTitle(layer, false), { ghost: true })}
          </div>
        ))}
        <div className={`col-span-2 ${TURN_PAIR}`}>
          {button({ flip: true }, t.sectorSlashTitle, {
            off: !turnAllowed(cube, { flip: true }),
          })}
        </div>
      </div>
    </div>
  )
}
