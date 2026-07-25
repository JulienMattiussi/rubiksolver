import { durationFromSlider, sliderFromDuration } from '@/lib/speed'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'

/** Animation speed slider (fast on the right). */
export function SpeedSlider() {
  const t = useI18n((s) => s.t)
  const turnDuration = useCube((s) => s.turnDuration)
  const setTurnDuration = useCube((s) => s.setTurnDuration)
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="speed"
        className="text-xs font-semibold uppercase tracking-wide text-slate-400"
      >
        {t.speed}
      </label>
      <input
        id="speed"
        type="range"
        min={0}
        max={100}
        value={Math.round(sliderFromDuration(turnDuration))}
        onChange={(e) => setTurnDuration(durationFromSlider(Number(e.target.value)))}
        className="flex-1 accent-sky-500"
      />
    </div>
  )
}
