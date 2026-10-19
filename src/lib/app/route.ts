import { CUBE_KINDS, cubeKindId, SHAPE_SLUG, type CubeKind, type CubeVariant } from '../core/types'

/**
 * The app's address: `#/<language>/<puzzle>`, e.g. `#/fr/floppy-ghost` or
 * `#/en/3x3-mirror`; the language alone (`#/fr`) is the home page. A puzzle's name is its shape's slug (`SHAPE_SLUG`),
 * `-mirror` added on a mirror cube, the same in every language. Pure: the
 * stores follow it in router.ts.
 */

/** The languages an address can name (the i18n locales). */
const LANGUAGES = ['fr', 'en'] as const
type Language = (typeof LANGUAGES)[number]

/** What an address names: either part may be missing or unknown. */
export interface Route {
  readonly locale?: Language
  readonly kind?: CubeKind
}

/** What a variant adds to a puzzle's name in the address. */
const VARIANT_SLUG: Record<CubeVariant, string> = { classic: '', mirror: '-mirror' }

/** A puzzle's name in the address. */
export function kindSlug(kind: CubeKind): string {
  return SHAPE_SLUG[kind.shape] + VARIANT_SLUG[kind.variant]
}

const KIND_OF_SLUG = new Map(CUBE_KINDS.map((kind) => [kindSlug(kind), kind]))

/** The address of a language and a puzzle, or of the home page. */
export function routeHash(locale: Language, kind?: CubeKind): string {
  return kind ? `#/${locale}/${kindSlug(kind)}` : `#/${locale}`
}

/** What an address names (`#/fr/domino`; `#/domino` or `#/fr` alone too). */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const locale = LANGUAGES.find((l) => l === parts[0])
  const kind = KIND_OF_SLUG.get(parts[locale ? 1 : 0] ?? '')
  return { ...(locale && { locale }), ...(kind && { kind }) }
}

/** Whether two puzzle choices are the same. */
export const sameKind = (a: CubeKind, b: CubeKind): boolean => cubeKindId(a) === cubeKindId(b)
