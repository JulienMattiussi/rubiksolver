import { inset, inside, type P2 } from '@/lib/core/plane'
import type { Cube } from '@/lib/core/types'
import { outlineReach, type Picture } from '@/lib/editor/scan/outlines'
import { ghostScan } from '@/lib/puzzles/flat/ghostScan'

/** How a synthetic picture of a Floppy Ghost is taken. */
export interface Shot {
  /** Turned on the picture, in radians; seen from the back. */
  readonly turn?: number
  readonly mirrored?: boolean
  /** Bigger or smaller than its frame says, and off its middle (pixels). */
  readonly zoom?: number
  readonly shift?: P2
  /** The background's lightness, and the noise on every pixel. */
  readonly background?: number
  readonly noise?: number
  /** A dark patch on the picture (a reflection): its middle, its radius. */
  readonly shadow?: { readonly at: P2; readonly radius: number }
}

const SIZE = 160

/** A picture of a Floppy Ghost in a state: silver stickers framed by black
 *  bodies, over a background. */
export function ghostPicture(cube: Cube, shot: Shot, rng: () => number): Picture {
  const { turn = 0, mirrored = false, zoom = 1, shift = [0, 0] } = shot
  const { background = 60, noise = 6, shadow } = shot
  const scale = (zoom * SIZE) / (2 * outlineReach(ghostScan))
  const pieces = cube.map((cubie) => {
    const outline = ghostScan.outline(cubie)
    return { outline, sticker: inset(outline, ghostScan.border) }
  })
  const [c, s] = [Math.cos(turn), Math.sin(turn)]
  const light = new Float64Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const [qx, qy] = [(x - SIZE / 2 - shift[0]) / scale, (SIZE / 2 + shift[1] - y) / scale]
      const px = c * qx + s * qy
      const p: P2 = [mirrored ? -px : px, -s * qx + c * qy]
      const piece = pieces.find((pc) => inside(pc.outline, p))
      let l = !piece ? background : inside(piece.sticker, p) ? 80 : 8
      if (shadow && Math.hypot(x - shadow.at[0], y - shadow.at[1]) < shadow.radius) l = 15
      light[y * SIZE + x] = l + (rng() - 0.5) * 2 * noise
    }
  return { width: SIZE, height: SIZE, light }
}
