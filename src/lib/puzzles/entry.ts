import type { Color, Dims, Face, InnerTurn } from '../core/types'

/** The pad of turns a puzzle shows (components/controls/padFor.tsx): its
 *  faces' unless it turns otherwise. */
export type PadKind =
  | 'faces'
  | 'star'
  | 'pyra'
  | 'ghost'
  | 'puck'
  | 'mega'
  | 'crystal'
  | 'fto'
  | 'rainbow'
  | 'dino'
  | 'rex'
  | 'skewb'
  | 'masterSkewb'
  | 'gear'

/** The hint the editor gives, when not the usual one (EditPanel.tsx). */
export type EditHint = 'twist' | 'camo' | 'roadblock' | 'quarter' | 'gear' | 'gearPlain'

/**
 * A puzzle's card: what the app knows of it besides its own module (how it
 * is built, turns and is solved: models.ts) and its drawing
 * (three/puzzles). Each category's cards are in its folder's catalog.ts.
 */
export interface PuzzleEntry {
  /** Its name in the picker, the same in every language. */
  readonly label: string
  /** Its name in the address (`#/fr/floppy-ghost`, see route.ts), the same
   *  in every language, so a link works whatever the reader's. */
  readonly slug: string
  /** Layer counts along x, y and z (the box of one without a grid). */
  readonly dims: Dims
  /** Turns in a scramble. */
  readonly scramble: number
  /** It leaves its box (see `SHAPE_SHIFTS`). */
  readonly shifts?: true
  /** Inner layers its mechanism turns (see `SHAPE_INNER_TURNS`). */
  readonly inner?: readonly InnerTurn[]
  /** Turns offered apart and never scrambled (see `SHAPE_ADVANCED_TURNS`). */
  readonly advanced?: readonly ('slice' | 'wide')[]
  /** Sold as a mirror puzzle too (see `supportsMirror`). */
  readonly mirror?: true
  /** Its colors where its real puzzle differs from the standard scheme. */
  readonly scheme?: Partial<Record<Face, Color>>
  /** Its pad of turns, when not its faces'. */
  readonly pad?: PadKind
  /** Its editor's hint, when not the usual one. */
  readonly editHint?: EditHint
}
