// French is the source of truth; English must provide every key (enforced by
// the `Translations` type). Values are content, not code. Each language is
// in its folder: the interface (ui.ts, with the turns' sentences from
// moveSentences.ts), the tutorial (tutorial.ts; on a mirror cube,
// tutorialMirror.ts), the methods (methods.ts)
// and their steps (steps.ts).

import { METHODS_EN } from './en/methods'
import { STEPS_EN } from './en/steps'
import { UI_EN } from './en/ui'
import { TUTORIAL_EN } from './en/tutorial'
import { TUTORIAL_FR } from './fr/tutorial'
import { TUTORIAL_MIRROR_FR } from './fr/tutorialMirror'
import { TUTORIAL_MIRROR_EN } from './en/tutorialMirror'
import { METHODS_FR } from './fr/methods'
import { STEPS_FR } from './fr/steps'
import { UI_FR } from './fr/ui'

const fr = {
  ...UI_FR,
  methods: METHODS_FR,
  steps: STEPS_FR,
  tutorial: TUTORIAL_FR,
  tutorialMirror: TUTORIAL_MIRROR_FR,
}

export type Translations = typeof fr

const en: Translations = {
  ...UI_EN,
  methods: METHODS_EN,
  steps: STEPS_EN,
  tutorial: TUTORIAL_EN,
  tutorialMirror: TUTORIAL_MIRROR_EN,
}

export const LOCALES = { fr, en }
export type Locale = keyof typeof LOCALES

/** A step's name in these translations (its key if it has none); on a
 *  mirror cube (`sizes`), the tutorial's own, which names a side by its
 *  thickness rather than its color. */
export const stepName = (t: Translations, key: string, sizes = false): string =>
  (sizes ? t.tutorialMirror.titles[key] : undefined) ??
  (t.steps as Record<string, string>)[key] ??
  key
