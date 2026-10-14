// French is the source of truth; English must provide every key (enforced by
// the `Translations` type). Values are content, not code. Each language is
// in its folder: the interface (ui.ts), the methods (methods.ts) and their
// steps (steps.ts).

import { METHODS_EN } from './en/methods'
import { STEPS_EN } from './en/steps'
import { UI_EN } from './en/ui'
import { METHODS_FR } from './fr/methods'
import { STEPS_FR } from './fr/steps'
import { UI_FR } from './fr/ui'

const fr = { ...UI_FR, methods: METHODS_FR, steps: STEPS_FR }

export type Translations = typeof fr

const en: Translations = { ...UI_EN, methods: METHODS_EN, steps: STEPS_EN }

export const LOCALES = { fr, en }
export type Locale = keyof typeof LOCALES
