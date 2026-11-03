import type { CubeKind } from '@/lib/core/shapes'
import type { Translations } from '@/i18n/translations'
import { aboutOf } from './about'

/** A page's title and description: the browser's tab, the search result;
 *  the same written at build time (seo/pages.tsx) and kept by the app as
 *  the reader moves on (App). */
export function headOf(t: Translations, kind?: CubeKind): { title: string; description: string } {
  if (!kind) return { title: t.pageTitle, description: t.metaDescription }
  const about = aboutOf(t, kind)
  return { title: t.puzzleTitle(about.name), description: about.summary }
}
