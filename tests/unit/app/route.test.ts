import { beforeEach, describe, expect, it } from 'vitest'
import { cubeShape } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/notation'
import { kindSlug, parseRoute, routeHash } from '@/lib/app/route'
import { CUBE_KINDS } from '@/lib/core/shapes'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { followRoute, goTo, useRoute } from '@/store/router'

describe('route', () => {
  it('names every puzzle once, and reads each name back', () => {
    const slugs = CUBE_KINDS.map(kindSlug)
    expect(new Set(slugs).size).toBe(CUBE_KINDS.length)
    for (const kind of CUBE_KINDS) {
      for (const locale of ['fr', 'en'] as const) {
        expect(parseRoute(routeHash(locale, kind))).toEqual({ locale, kind })
      }
    }
    expect(routeHash('fr', { shape: 'ghost', variant: 'classic' })).toBe('#/fr/floppy-ghost')
    expect(routeHash('en', { shape: '3', variant: 'mirror' })).toBe('#/en/3x3-mirror')
    expect(routeHash('fr')).toBe('#/fr')
  })

  it('reads a part alone, and leaves out what it does not know', () => {
    expect(parseRoute('#/domino')).toEqual({ kind: { shape: '332', variant: 'classic' } })
    expect(parseRoute('#/en')).toEqual({ locale: 'en' })
    expect(parseRoute('#/de/nope')).toEqual({})
    expect(parseRoute('')).toEqual({})
  })
})

describe('router', () => {
  beforeEach(() => {
    useCube.getState().setShape('3')
    useCube.getState().setVariant('classic')
    useCube.getState().reset()
    useEditor.setState({ mode: 'play' })
    useI18n.getState().setLocale('fr')
    window.history.replaceState(null, '', '#/fr/3x3')
    useRoute.setState({ home: false })
  })

  it('opens the puzzle and the language a link names', () => {
    window.history.replaceState(null, '', '#/en/2x2-mirror')
    followRoute()
    expect(cubeShape(useCube.getState().cube)).toBe('2')
    expect(useCube.getState().variant).toBe('mirror')
    expect(useI18n.getState().locale).toBe('en')
  })

  it('completes an address without language, and shows home without a puzzle', () => {
    window.history.replaceState(null, '', '#/pyraminx')
    followRoute()
    expect(window.location.hash).toBe('#/fr/pyraminx')
    expect(useRoute.getState().home).toBe(false)
    window.history.replaceState(null, '', '#/nowhere')
    followRoute()
    expect(window.location.hash).toBe('#/fr')
    expect(useRoute.getState().home).toBe(true)
  })

  it('goes home and back to a puzzle, the language kept', () => {
    goTo({ kind: null })
    expect(window.location.hash).toBe('#/fr')
    goTo({ locale: 'en' })
    expect(window.location.hash).toBe('#/en')
    expect(useRoute.getState().home).toBe(true)
    goTo({ kind: { shape: '332', variant: 'classic' } })
    expect(window.location.hash).toBe('#/en/domino')
    expect(useRoute.getState().home).toBe(false)
  })

  it('goes to a puzzle or a language as a new page, keeping the other', () => {
    const before = window.history.length
    goTo({ kind: { shape: 'ghost', variant: 'classic' } })
    expect(window.location.hash).toBe('#/fr/floppy-ghost')
    expect(cubeShape(useCube.getState().cube)).toBe('ghost')
    goTo({ locale: 'en' })
    expect(window.location.hash).toBe('#/en/floppy-ghost')
    expect(useI18n.getState().t.language).toBe('Language')
    expect(window.history.length).toBe(before + 2)
  })

  it('keeps the puzzle while a turn plays, the address put back', () => {
    useCube.getState().pushMove(parseMoves('R')[0]!)
    window.history.replaceState(null, '', '#/fr/domino')
    followRoute()
    expect(cubeShape(useCube.getState().cube)).toBe('3')
    expect(window.location.hash).toBe('#/fr/3x3')
  })
})
