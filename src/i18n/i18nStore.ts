import { create } from 'zustand'
import { LOCALES, type Locale, type Translations } from './translations'

interface I18nState {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
}

function detectLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('en')) return 'en'
  return 'fr'
}

const initial = detectLocale()

export const useI18n = create<I18nState>((set) => ({
  locale: initial,
  t: LOCALES[initial],
  setLocale: (locale) => {
    if (typeof document !== 'undefined') document.documentElement.lang = locale
    set({ locale, t: LOCALES[locale] })
  },
}))
