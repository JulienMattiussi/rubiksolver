import type { Color } from '@/lib/core/types'

/** Sticker colors of the physical cube (standard Western scheme). */
export const COLOR_HEX: Record<Color, string> = {
  W: '#f8fafc',
  Y: '#facc15',
  G: '#22c55e',
  B: '#3b82f6',
  O: '#f97316',
  R: '#ef4444',
  // The star prism's two extra valley colors.
  P: '#ec4899',
  V: '#8b5cf6',
  // The Rainbow's other triangles.
  E: '#15803d',
  N: '#1e40af',
  T: '#2dd4bf',
  K: '#fbcfe8',
  M: '#92400e',
  L: '#a3e635',
  // The GEM-0's squares, golden.
  C: '#d6b25e',
  // The Hockey Puck's center, graphite (drawn only: no sticker wears it).
  H: '#5b6273',
}

/** Dark plastic body of a cubie. */
export const PLASTIC = '#0b0f1a'

/** Glow of the pieces a hovered turn would move (the UI's accent, sky). */
export const HIGHLIGHT = '#38bdf8'

/** Mirror cube: every facelet wears the same gold, pieces are told apart by
 *  their size. */
export const MIRROR_STICKER = '#d8a63f'

/** Floppy Ghost: every facelet silver, like the real one. */
export const GHOST_STICKER = '#c8cfd8'

/** A cell of a face being copied that shows no sticker (faceCanvases.ts): a piece's plastic or a hole, a little lighter than the
 *  plastic so it reads as painted. */
export const ABSENT_HEX = '#1e293b'
