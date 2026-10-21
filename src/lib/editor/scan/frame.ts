/**
 * Where the frame the user aims a face into lies (pure): centered on the
 * screen, as wide as the face's grid is (a cuboid's faces are rectangles),
 * and in the camera's picture, which fills the screen cropped (`cover`).
 */

export interface Size {
  readonly width: number
  readonly height: number
}

export interface Rect extends Size {
  readonly x: number
  readonly y: number
}

/** How much of the screen's smaller side the frame takes. */
const FRAME_SHARE = 0.72

/** The frame on a screen, for a grid of `rows` by `cols`. */
export function frameOnScreen(screen: Size, rows: number, cols: number): Rect {
  const side = (FRAME_SHARE * Math.min(screen.width, screen.height)) / Math.max(rows, cols)
  const [width, height] = [side * cols, side * rows]
  return { x: (screen.width - width) / 2, y: (screen.height - height) / 2, width, height }
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
