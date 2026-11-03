import { finishOf } from '@/lib/core/shape'
import type { CubeShape, CubeVariant } from '@/lib/core/shapes'

// The stickers' colors live with the model (the camera scan reads them too).
export { COLOR_HEX } from '@/lib/core/stickerColors'

/** Dark plastic body of a cubie. */
export const PLASTIC = '#0b0f1a'

/** Glow of the pieces a hovered turn would move (the UI's accent, sky). */
export const HIGHLIGHT = '#38bdf8'

/** A tutorial's mark for the place a piece goes: its arrow's amber. */
export const PLACE = '#fbbf24'

/** Floppy Ghost: every facelet silver, like the real one. */
export const GHOST_STICKER = '#c8cfd8'

/** Mirror cube: every facelet wears the same finish, pieces are told apart
 *  by their size (the Mirror Blocks gold, the Qiyi 2x2 silver). */
const FINISH_HEX = { gold: '#d8a63f', silver: '#e8edf3' }

/** The skin every sticker of a puzzle wears in a variant whose stickers
 *  tell sizes (lib/core/shape.ts: its mirror's finish), metal; none where
 *  they tell colors. */
export const skinOf = (shape: CubeShape, variant: CubeVariant): string | undefined =>
  variant === 'classic' ? undefined : FINISH_HEX[finishOf(shape)]

/** A cell of a face being copied that shows no sticker (faceCanvases.ts): a piece's plastic or a hole, a little lighter than the
 *  plastic so it reads as painted. */
export const ABSENT_HEX = '#1e293b'

/** Gray shown on a not-yet-painted sticker slot. */
export const EMPTY_COLOR = '#64748b'
