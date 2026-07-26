import { create } from 'zustand'
import { LOCALES, type Locale, type Translations } from './translations'

/** Move notation: 'us' (U R F...) or 'fr' (H D F...). Independent of locale. */
export type Notation = 'us' | 'fr'

interface I18nState {
  locale: Locale
  t: Translations
  notation: Notation
  setLocale: (locale: Locale) => void
  setNotation: (notation: Notation) => void
}

function detectLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('en')) return 'en'
  return 'fr'
}

const initial = detectLocale()

export const useI18n = create<I18nState>((set) => ({
  locale: initial,
  t: LOCALES[initial],
  // International notation by default, whatever the locale (toggleable).
  notation: 'us',
  setLocale: (locale) => {
    if (typeof document !== 'undefined') document.documentElement.lang = locale
    set({ locale, t: LOCALES[locale] })
  },
  setNotation: (notation) => set({ notation }),
}))
