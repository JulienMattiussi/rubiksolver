import { routePath, type Language } from '@/lib/app/route'
import type { CubeKind } from '@/lib/core/shapes'

/** Where the site is served. */
export const ORIGIN = 'https://rubiksolver.yavadeus.dev'

/** A page the search engines read (seo/pages.tsx). */
export interface Page {
  readonly locale: Language
  /** The puzzle shown, none on the home page. */
  readonly kind?: CubeKind
}

/** A page's full address. */
export const urlOf = (locale: Language, kind?: CubeKind) => ORIGIN + routePath(locale, kind)
