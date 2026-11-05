import type { FaceLabels } from '../../core/notation'
import type { MegaFace, MegaMove } from '../../core/types'

/**
 * The Megaminx's notation (pure): U F R... in English, fan2cube's letters
 * in French; the whole puzzle's turns written as a cube's rotations.
 */

/** fan2cube's letters, the puzzle held with A in front and H above it:
 *  around A clockwise H, D, B, P (underlined), G; the others opposite
 *  them, underlined (a combining low line). */
const UNDER = '̲'
const FR: Record<MegaFace, string> = {
  U: 'H',
  F: 'A',
  R: 'D',
  L: 'G',
  BR: 'P',
  BL: `B${UNDER}`,
  DR: 'B',
  DL: `P${UNDER}`,
  DBL: `D${UNDER}`,
  DBR: `G${UNDER}`,
  B: `A${UNDER}`,
  D: `H${UNDER}`,
}

const SUFFIX = { 1: '', 2: '2', 3: "2'", 4: "'" } as const

/** The whole puzzle's turns, written as a cube's in both languages: y
 *  about the vertical, x tipping the face beneath toward the viewer (about
 *  the one below between F and R, as a cube's x brings its bottom in
 *  front); any other, its face's letter in lower case. */
const ROTATION_OF: Partial<Record<MegaFace, string>> = { U: 'y', DR: 'x' }

/** A turn as written; the puzzle turned whole, as a rotation. */
export function formatMegaMove(move: MegaMove, labels: FaceLabels): string {
  const face = labels.U === 'U' ? move.megaFace : FR[move.megaFace]
  const letter = move.whole ? (ROTATION_OF[move.megaFace] ?? face.toLowerCase()) : face
  return letter + SUFFIX[move.amount]
}
