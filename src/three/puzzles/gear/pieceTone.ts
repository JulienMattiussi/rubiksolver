import type { PieceTone } from '@/three/core/Cubie'
import { paintable } from '@/three/core/paintable'

/** How a Gear Cube piece shows its tone (see Cubie's `PieceTone`). */

/** Whether a piece glows: lit by the pad, or aimed at by the tutorial. */
export const glows = (tone: PieceTone) => tone.highlighted || tone.marked === true

/** A part of a piece's tone (an edge's `gear` or `clips`): the piece's,
 *  or, when a word names another part of it (`PieceTone.part`), the tone
 *  of a piece it does not name (hatched, unlit). */
export const partTone = (tone: PieceTone, part: string): PieceTone =>
  !tone.part || tone.part === part || !glows(tone)
    ? tone
    : { ...tone, highlighted: false, marked: false, hatched: true }

/** The pointer props of a face of a Gear Cube piece: a click painting it
 *  (edit mode, `onSelect`), else picking the piece (the tutorial's). */
export const selectable = (
  tone: PieceTone,
  onSelect?: () => void,
  onHover?: (on: boolean) => void,
) => (onSelect ? paintable(onSelect, onHover) : paintable(tone.onPick, tone.onPickHover))
