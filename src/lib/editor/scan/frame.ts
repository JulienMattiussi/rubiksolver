/**
 * Where the frame the user aims a face into lies (pure): centered in the
 * room the screen leaves it (below the instruction, above the buttons),
 * as wide as the face is (a cuboid's faces are rectangles), and in
 * the camera's picture, which fills the screen cropped (`cover`).
 */

export interface Size {
  readonly width: number
  readonly height: number
}

export interface Rect extends Size {
  readonly x: number
  readonly y: number
}

/** How much of the screen's width the frame takes, at most, and of the
 *  height left it. */
const WIDTH_SHARE = 0.72
const HEIGHT_SHARE = 0.92

/** A face read whole (a Floppy Ghost: outlines.ts) is framed over the
 *  whole screen, this share of it at most: its frame leaves room for every
 *  state, so the puzzle fills only its middle, which the instruction and
 *  the buttons leave clear, and the bigger it shows, the sharper it is read. */
const WHOLE_SHARE = 0.9

/** The frame on a screen, for a face `width` by `height` units, between
 *  `top` and `bottom` pixels kept for the rest (but for a face read whole). */
export function frameOnScreen(
  screen: Size,
  face: Size & { readonly whole?: unknown },
  top = 0,
  bottom = 0,
): Rect {
  if (face.whole) [top, bottom] = [0, 0]
  const room = Math.max(0, screen.height - top - bottom)
  const [across, down] = face.whole ? [WHOLE_SHARE, WHOLE_SHARE] : [WIDTH_SHARE, HEIGHT_SHARE]
  const unit = Math.min(across * screen.width, down * room) / Math.max(face.width, face.height)
  const [width, height] = [unit * face.width, unit * face.height]
  return { x: (screen.width - width) / 2, y: top + (room - height) / 2, width, height }
}

/** The same rectangle in the picture, which covers the screen: scaled to
 *  fill it, its overflow cut evenly on both sides. */
export function screenToPicture(rect: Rect, screen: Size, picture: Size): Rect {
  const scale = Math.max(screen.width / picture.width, screen.height / picture.height)
  const dx = (screen.width - picture.width * scale) / 2
  const dy = (screen.height - picture.height * scale) / 2
  return {
    x: (rect.x - dx) / scale,
    y: (rect.y - dy) / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  }
}
