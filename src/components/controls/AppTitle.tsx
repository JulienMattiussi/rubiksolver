import { useI18n } from '@/i18n/i18nStore'
import { goTo } from '@/store/router'

/** The app's title, leading home: its icon (the favicon), and its name
 *  unless left out (a phone's bar while the panel is open). */
export function AppTitle({ named = true }: { named?: boolean }) {
  const t = useI18n((s) => s.t)
  return (
    <h1 className="text-lg font-bold text-white">
      <button
        type="button"
        onClick={() => goTo({ kind: null })}
        title={t.homeLink}
        className="flex items-center gap-2 rounded transition hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        {/* Decorative beside the name. */}
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" aria-hidden className="size-6" />
        {/* Left out, still said (the heading and the button keep a name). */}
        {named ? t.title : <span className="sr-only">{t.title}</span>}
      </button>
    </h1>
  )
}
