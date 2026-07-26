import type { Color } from '@/lib/types'

/** Sticker colors of the physical cube (standard Western scheme). */
export const COLOR_HEX: Record<Color, string> = {
  W: '#f8fafc',
  Y: '#facc15',
  G: '#22c55e',
  B: '#3b82f6',
  O: '#f97316',
  R: '#ef4444',
}

/** Dark plastic body of a cubie. */
export const PLASTIC = '#0b0f1a'

/** Mirror cube: every facelet wears the same gold, pieces are told apart by
 *  their size. */
export const MIRROR_STICKER = '#d8a63f'
