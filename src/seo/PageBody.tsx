import { routePath } from '@/lib/app/route'
import { CUBE_KINDS, SHAPE_LABEL } from '@/lib/core/shapes'
import { LOCALES } from '@/i18n/translations'
import { AboutText } from '@/components/about/AboutText'
import { aboutOf } from './about'
import type { Page } from './page'

/** What the page shows until the app draws over it: the puzzle's page, or
 *  on the home page a link to every puzzle (the whole catalog, not only the
 *  gallery, so crawlers reach each page from the home page). */
export function PageBody({ locale, kind }: Page) {
  const t = LOCALES[locale]
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <a href={routePath(locale)} className="text-lg font-bold text-white">
        {t.title}
      </a>
      {kind ? (
        <AboutText about={aboutOf(t, kind)} Title="h1" />
      ) : (
        <>
          <h1 className="text-2xl font-bold text-white">{t.pageTitle}</h1>
          <p className="text-sm leading-relaxed text-slate-300">{t.metaDescription}</p>
          <ul className="flex flex-col gap-1 text-sm">
            {CUBE_KINDS.map((kind) => (
              <li key={routePath(locale, kind)}>
                <a href={routePath(locale, kind)} className="text-sky-300">
                  {t.cubeKind(SHAPE_LABEL[kind.shape], kind.variant)}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
