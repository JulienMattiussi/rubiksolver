import { useI18n } from '@/i18n/i18nStore'

/** The author's line, at the foot of the panel: a link to their site. */
export function Credit() {
  const t = useI18n((s) => s.t)
  return (
    <p className="text-center text-xs text-slate-500">
      {t.madeWith.before}{' '}
      <span role="img" aria-label={t.madeWith.love}>
        ❤️
      </span>{' '}
      {t.madeWith.by}{' '}
      <a
        href="https://yavadeus.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded font-semibold text-slate-300 transition hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        YavaDeus
      </a>
    </p>
  )
}
