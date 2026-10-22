import type { CubeVariant } from '@/lib/core/shapes'

// The stickers' colors live with the model (the camera scan reads them too).
export { COLOR_HEX } from '@/lib/core/stickerColors'

/** Dark plastic body of a cubie. */
export const PLASTIC = '#0b0f1a'

/** Glow of the pieces a hovered turn would move (the UI's accent, sky). */
export const HIGHLIGHT = '#38bdf8'

/** A tutorial's mark for the place a piece goes: its arrow's amber. */
export const PLACE = '#fbbf24'

/** Mirror cube: every facelet wears the same gold, pieces are told apart by
 *  their size. */
const MIRROR_STICKER = '#d8a63f'

/** The skin every sticker wears on a variant whose stickers tell sizes
 *  (lib/core/shape.ts: a mirror's gold), metal; none where they tell
 *  colors. */
export const VARIANT_SKIN: Record<CubeVariant, string | undefined> = {
  classic: undefined,
  mirror: MIRROR_STICKER,
}

/** Floppy Ghost: every facelet silver, like the real one. */
export const GHOST_STICKER = '#c8cfd8'

/** A cell of a face being copied that shows no sticker (faceCanvases.ts): a piece's plastic or a hole, a little lighter than the
 *  plastic so it reads as painted. */
export const ABSENT_HEX = '#1e293b'

/** Gray shown on a not-yet-painted sticker slot. */
export const EMPTY_COLOR = '#64748b'
