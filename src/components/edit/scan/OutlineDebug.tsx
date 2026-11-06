import { useOutlineDebug } from '@/store/outlineDebug'
import { useI18n } from '@/i18n/i18nStore'

/** What the reading of a puzzle by its outlines saw (`?scandebug`), over
 *  the editor, until closed (outlineDebug.ts). */
export function OutlineDebug() {
  const image = useOutlineDebug((s) => s.image)
  const hide = useOutlineDebug((s) => s.hide)
  const t = useI18n((s) => s.t)
  if (!image) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-h-full max-w-full">
        <img src={image} alt="" className="max-h-[90vh] max-w-full rounded" />
        <button
          type="button"
          onClick={hide}
          className="absolute top-2 right-2 rounded bg-white/90 px-3 py-1 text-sm font-semibold text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
        >
          {t.close}
        </button>
      </div>
    </div>
  )
}
