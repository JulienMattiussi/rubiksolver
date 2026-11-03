import { renderToStaticMarkup } from 'react-dom/server'
import { LANGUAGES, routePath } from '@/lib/app/route'
import { CUBE_KINDS } from '@/lib/core/shapes'
import { PageBody } from './PageBody'
import { PageHead } from './PageHead'
import { urlOf, type Page } from './page'

/**
 * The pages the search engines read: one per language and puzzle, and each
 * language's home page (lib/app/route.ts names them). The app is one page
 * that draws what its address names; at build time, each of these is
 * written as its own file (scripts/prerender.mjs), the same page with its
 * own head (PageHead) and, in place of the empty root the app then draws
 * over, the text the app shows (PageBody).
 */

const PAGES: readonly Page[] = LANGUAGES.flatMap((locale) => [
  { locale },
  ...CUBE_KINDS.map((kind) => ({ locale, kind })),
])

/** Marks in index.html where a page's head and body go. */
const HEAD_MARK = /<!--page-head-->[\s\S]*<!--\/page-head-->/
const BODY_MARK = '<!--page-body-->'

/** Each page as a file of the built site, from the built index.html: its
 *  path (`fr/gear-cube-ultimate.html`), then its content. The site's root
 *  (`index.html`) is the first language's home page. */
export function prerender(template: string): { file: string; html: string }[] {
  const write = (page: Page) =>
    template
      .replace(/<html lang="[^"]*">/, `<html lang="${page.locale}">`)
      .replace(HEAD_MARK, () => renderToStaticMarkup(<PageHead {...page} />))
      .replace(BODY_MARK, () => renderToStaticMarkup(<PageBody {...page} />))
  return [
    { file: 'index.html', html: write(PAGES[0]!) },
    ...PAGES.map((page) => ({
      file: `${routePath(page.locale, page.kind).slice(1)}.html`,
      html: write(page),
    })),
  ]
}

/** The sitemap: every page, with its address in each language. */
export function sitemap(): string {
  const entry = ({ locale, kind }: Page) =>
    [
      '  <url>',
      `    <loc>${urlOf(locale, kind)}</loc>`,
      ...LANGUAGES.map(
        (other) =>
          `    <xhtml:link rel="alternate" hreflang="${other}" href="${urlOf(other, kind)}"/>`,
      ),
      '  </url>',
    ].join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...PAGES.map(entry),
    '</urlset>',
    '',
  ].join('\n')
}
