import { cubeShape } from '@/lib/core/cube'
import { STAR_RINGS } from '@/lib/puzzles/round/star'
import { isStar } from '@/lib/core/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadHeader } from './PadHeader'
import { useTurnButton } from './useTurnButton'

/**
 * Rotation pad of a star prism: each of its layers (two, or four on the
 * 4-star) by one piece either way, and the slash (see PadButton).
 */
export function StarPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const button = useTurnButton(disabled)
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-2 gap-2">
        {(isStar(shape) ? STAR_RINGS[shape] : []).map((ring) => (
          <div key={ring} className={TURN_PAIR}>
            {button({ ring, amount: 1 }, t.starTurnTitle(ring, true))}
            {button({ ring, amount: 5 }, t.starTurnTitle(ring, false), { ghost: true })}
          </div>
        ))}
        <div className={`col-span-2 ${TURN_PAIR}`}>{button({ slash: true }, t.slashTitle)}</div>
      </div>
    </div>
  )
}
