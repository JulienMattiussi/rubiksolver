/**
 * Where the frame the user aims a face into lies (pure): centered in the
 * room the screen leaves it (below the instruction, above the buttons),
 * as wide as the face's grid is (a cuboid's faces are rectangles), and in
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

/** The frame on a screen, for a grid of `rows` by `cols`, between `top`
 *  and `bottom` pixels kept for the rest. */
export function frameOnScreen(screen: Size, rows: number, cols: number, top = 0, bottom = 0): Rect {
  const room = Math.max(0, screen.height - top - bottom)
  const side = Math.min(WIDTH_SHARE * screen.width, HEIGHT_SHARE * room) / Math.max(rows, cols)
  const [width, height] = [side * cols, side * rows]
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
