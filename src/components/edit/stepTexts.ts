import { Box, Cog, Layers, Link2, Rows3, Shapes, type LucideIcon } from 'lucide-react'
import type { EntryStep } from '@/lib/editor/entry'
import type { Translations } from '@/i18n/translations'

/** What an entry step shows: its hint, its buttons' labels (accept it, come
 *  back to it from the colors) and icon, the error if refused. */
export interface StepTexts {
  readonly hint: string
  readonly accept: string
  readonly change: string
  readonly icon: LucideIcon
  readonly error?: string
}

/** A step's texts, by its mode (a toggles step's, by what it toggles). */
export function stepTexts(t: Translations, step: EntryStep): StepTexts {
  switch (step.kind) {
    case 'form':
      return { hint: t.chooseFormHint, accept: t.chooseForm, change: t.changeForm, icon: Shapes }
    case 'canvas':
      return { hint: t.editHintFaces, accept: t.findShape, change: t.changeFaces, icon: Box }
    case 'cuts':
      return {
        hint: t.editHintCuts,
        accept: t.acceptCuts,
        change: t.changeCuts,
        icon: Layers,
        error: t.errorCuts,
      }
    case 'joints':
      return {
        hint: t.editHintJoints,
        accept: t.acceptJoints,
        change: t.changeJoints,
        icon: Link2,
        error: t.errorJoints,
      }
    case 'toggles':
      return step.toggles.name === 'gears'
        ? { hint: t.editHintGears, accept: t.acceptGears, change: t.changeGears, icon: Cog }
        : { hint: t.editHintBars, accept: t.acceptBars, change: t.changeBars, icon: Rows3 }
  }
}
