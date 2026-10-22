import {
  durationFromSlider,
  pauseBetweenTurns,
  sayDuration,
  sliderFromDuration,
} from '@/lib/app/speed'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SECTION_LABEL } from '@/components/ui/styles'

/** Animation speed slider (fast on the right), the time a move takes said
 *  on hover (its pause after it included, at the slowest). */
export function SpeedSlider() {
  const t = useI18n((s) => s.t)
  const turnDuration = useCube((s) => s.turnDuration)
  const setTurnDuration = useCube((s) => s.setTurnDuration)
  const { value, unit } = sayDuration(turnDuration + pauseBetweenTurns(turnDuration))
  const hint = t.speedHint(value, unit)
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="speed" className={SECTION_LABEL}>
        {t.speed}
      </label>
      <input
        id="speed"
        type="range"
        min={0}
        max={100}
        value={Math.round(sliderFromDuration(turnDuration))}
        onChange={(e) => setTurnDuration(durationFromSlider(Number(e.target.value)))}
        title={hint}
        aria-valuetext={hint}
        className="flex-1 accent-sky-500"
      />
    </div>
  )
}
