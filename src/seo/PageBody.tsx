import { routePath } from '@/lib/app/route'
import { HOME_KINDS, SHAPE_LABEL } from '@/lib/core/shapes'
import { LOCALES } from '@/i18n/translations'
import { AboutText } from '@/components/about/AboutText'
import { aboutOf } from './about'
import type { Page } from './page'

/** What the page shows until the app draws over it: the puzzle's page, or
 *  the home page's gallery as links. */
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
            {HOME_KINDS.map((home) => (
              <li key={routePath(locale, home)}>
                <a href={routePath(locale, home)} className="text-sky-300">
                  {t.cubeKind(SHAPE_LABEL[home.shape], home.variant)}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
