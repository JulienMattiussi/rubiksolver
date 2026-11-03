import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from '@/lib/app/route'
import { LOCALES } from '@/i18n/translations'
import { aboutOf } from './about'
import { headOf } from './head'
import { ORIGIN, urlOf, type Page } from './page'

/** The Open Graph locale of each language. */
const OG_LOCALE: Record<Language, string> = { fr: 'fr_FR', en: 'en_US' }

/** What a page adds to the head: title, description, canonical address,
 *  the same page in each language, the share preview's words, and what it
 *  is for the search engines (JSON-LD). */
export function PageHead({ locale, kind }: Page) {
  const t = LOCALES[locale]
  const { title, description } = headOf(t, kind)
  const url = urlOf(locale, kind)
  const home = urlOf(locale)
  const data = kind
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url,
        inLanguage: locale,
        isPartOf: { '@type': 'WebSite', name: t.title, url: home },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: t.title, item: home },
            { '@type': 'ListItem', position: 2, name: aboutOf(t, kind).name, item: url },
          ],
        },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: t.title,
        url,
        image: `${ORIGIN}/og.png`,
        description,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires WebGL',
        inLanguage: locale,
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        author: { '@type': 'Person', name: 'YavaDeus' },
      }
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {LANGUAGES.map((other) => (
        <link key={other} rel="alternate" hrefLang={other} href={urlOf(other, kind)} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={urlOf(DEFAULT_LANGUAGE, kind)} />
      <meta property="og:locale" content={OG_LOCALE[locale]} />
      {LANGUAGES.filter((other) => other !== locale).map((other) => (
        <meta key={other} property="og:locale:alternate" content={OG_LOCALE[other]} />
      ))}
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <script
        type="application/ld+json"
        // JSON in a script: a `<` would end it early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
      />
    </>
  )
}
