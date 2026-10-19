import { create } from 'zustand'
import { NOTATION_FR, NOTATION_US, type FaceLabels } from '@/lib/core/notation'
import { readStored, writeStored } from '@/lib/app/storage'
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

/** The notation chosen, kept between visits. */
const NOTATION_KEY = 'rubiksolver.notation'
const isNotation = (value: unknown): value is Notation => value === 'us' || value === 'fr'

export const useI18n = create<I18nState>((set) => ({
  locale: initial,
  t: LOCALES[initial],
  // International notation by default, whatever the locale (toggleable),
  // or the one chosen on a previous visit.
  notation: readStored(NOTATION_KEY, isNotation, 'us'),
  setLocale: (locale) => set({ locale, t: LOCALES[locale] }),
  setNotation: (notation) => {
    writeStored(NOTATION_KEY, notation)
    set({ notation })
  },
}))

/** Face letters of the chosen notation, for every displayed move. */
export const selectMoveLabels = (s: I18nState): FaceLabels =>
  s.notation === 'fr' ? NOTATION_FR : NOTATION_US
