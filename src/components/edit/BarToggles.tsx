import { FACES } from '@/lib/core/moves'
import { barFaceKey } from '@/lib/puzzles/twisted/roadblock'
import { useI18n } from '@/i18n/i18nStore'
import { useEditor } from '@/store/editorStore'
import { SECTION_LABEL } from '@/components/ui/styles'

/** A RoadBlock-I entered: which faces have their bars a quarter turn off
 *  START, one toggle per face (its centers turned a quarter with it). */
export function BarToggles() {
  const t = useI18n((s) => s.t)
  const turned = useEditor((s) => s.twisted)
  const turnBarsAt = useEditor((s) => s.turnBarsAt)
  return (
    <div className="flex flex-col gap-2">
      <span className={SECTION_LABEL}>{t.barsTurnedLabel}</span>
      <div className="grid grid-cols-3 gap-1.5">
        {FACES.map((face) => {
          const key = barFaceKey(face)
          const on = turned.includes(key)
          return (
            <button
              key={face}
              type="button"
              aria-pressed={on}
              title={t.barsTurnedTitle(t.faceNames[face])}
              onClick={() => turnBarsAt(key)}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                on ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t.barFaces[face]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
