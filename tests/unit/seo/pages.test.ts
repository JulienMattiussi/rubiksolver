import { describe, expect, it } from 'vitest'
import { CUBE_KINDS, cubeKindId } from '@/lib/core/shapes'
import { LOCALES } from '@/i18n/translations'
import { PUZZLES_FR } from '@/i18n/fr/puzzles'
import { PUZZLES_EN } from '@/i18n/en/puzzles'
import { aboutOf } from '@/seo/about'
import { headOf } from '@/seo/head'
import { prerender, sitemap } from '@/seo/pages'

const TEMPLATE = `<html lang="fr"><head><!--page-head--><title>Rubik Solver</title><!--/page-head--></head><body><div id="root"><!--page-body--></div></body></html>`
const GEAR_U = { shape: 'gearU', variant: 'classic' } as const

describe('a puzzle’s page', () => {
  it('says what the puzzle is like in its own words', () => {
    expect(aboutOf(LOCALES.fr, GEAR_U)).toEqual({
      name: 'Gear Cube Ultimate',
      ...PUZZLES_FR.gearU,
    })
  })

  it('names its methods where it has no words of its own yet, the taught ones put forward', () => {
    const about = aboutOf(LOCALES.fr, { shape: '3', variant: 'mirror' })
    expect(about.summary).toMatch(/^3x3 miroir en 3D, .* avec les méthodes .*\.$/)
    expect(about.about).toBeUndefined()
    expect(about.methods).toMatch(
      /^7 méthodes pour le résoudre, au choix : Par couches, .* et ZZ\./,
    )
    expect(about.methods).toMatch(/ont leur tutoriel, pour les apprendre pas à pas\.$/)
    expect(aboutOf(LOCALES.en, { shape: 'megaminx', variant: 'classic' }).methods).toMatch(
      /^One method to solve it: [^.]+\.$/,
    )
  })

  it('has words only for real puzzles, short enough for a search result', () => {
    const ids = new Set(CUBE_KINDS.map(cubeKindId))
    for (const locale of ['fr', 'en'] as const) {
      for (const [id, text] of Object.entries(LOCALES[locale].puzzles)) {
        expect(ids.has(id)).toBe(true)
        expect(text.summary.length).toBeLessThanOrEqual(160)
      }
    }
  })

  it('is titled after its puzzle, the home page after the app', () => {
    expect(headOf(LOCALES.fr, GEAR_U).title).toBe(
      'Gear Cube Ultimate : solution pas à pas | Rubik Solver',
    )
    expect(headOf(LOCALES.en).title).toBe(LOCALES.en.pageTitle)
  })
})

describe('the pages written at build time', () => {
  const pages = new Map(prerender(TEMPLATE).map((p) => [p.file, p.html]))

  it('writes the home page and every puzzle, in each language', () => {
    expect(pages.size).toBe(1 + 2 * (1 + CUBE_KINDS.length))
    expect([...pages.keys()].slice(0, 3)).toEqual(['index.html', 'fr.html', 'fr/2x2.html'])
    expect(pages.get('index.html')).toBe(pages.get('fr.html'))
  })

  it('gives each its title, its address in each language, and its text', () => {
    const html = pages.get('en/gear-cube-ultimate.html')!
    expect(html).toContain('<html lang="en">')
    expect(html).toContain(
      '<title>Gear Cube Ultimate: step-by-step solution | Rubik Solver</title>',
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://rubiksolver.yavadeus.dev/en/gear-cube-ultimate"/>',
    )
    expect(html).toContain(
      'hrefLang="fr" href="https://rubiksolver.yavadeus.dev/fr/gear-cube-ultimate"',
    )
    expect(html).toContain('"@type":"BreadcrumbList"')
    expect(html).toContain('<h1 class="text-base font-bold text-white">Gear Cube Ultimate</h1>')
    expect(html).toContain(PUZZLES_EN.gearU.methods)
    expect(html).toContain('<strong class="font-semibold text-white">gears</strong>')
    expect(html).toContain(`>${PUZZLES_EN.gearU.methodsTitle}</h3>`)
    expect(html).not.toContain('**')
    expect(html).not.toContain('<!--page-')
  })

  it('links the home page to the puzzles of its gallery', () => {
    expect(pages.get('fr.html')).toContain('<a href="/fr/gear-cube-ultimate"')
  })

  it('lists every page in the sitemap, with its other language', () => {
    const map = sitemap()
    expect(map.match(/<loc>/g)).toHaveLength(2 * (1 + CUBE_KINDS.length))
    expect(map).toContain(
      '<xhtml:link rel="alternate" hreflang="en" href="https://rubiksolver.yavadeus.dev/en/2x2-qiyi-mirror"/>',
    )
  })
})
