import { useI18n } from '@/i18n/i18nStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadHeader } from './PadHeader'
import { useTurnButton } from './useTurnButton'

/** Rotation pad of the Hockey Puck, as a star prism's: each disc a notch
 *  either way, and the slash (see PadButton). */
export function PuckPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const button = useTurnButton(disabled)
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-2 gap-2">
        {(['U', 'D'] as const).map((layer) => (
          <div key={layer} className={TURN_PAIR}>
            {button({ layer, steps: 1 }, t.puckTurnTitle(layer, true))}
            {button({ layer, steps: 11 }, t.puckTurnTitle(layer, false), { ghost: true })}
          </div>
        ))}
        <div className={`col-span-2 ${TURN_PAIR}`}>{button({ flip: true }, t.puckSlashTitle)}</div>
      </div>
    </div>
  )
}
