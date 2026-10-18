import type { TutorialTexts } from '../../tutorialTexts'

/** What the pyramid tutorials share (Pyraminx, Pyramorphinx): how to hold
 *  one, laid flat. */
export const PYRAMIDS_FR: TutorialTexts = {
  holding: {
    flat: (color: string, down: string) =>
      `Place la pyramide à plat, le ${down} dessous, le ${color} face à toi.`,
  },
}
