import type cvModule from '@techstark/opencv-js'
import type { Rect } from '@/lib/editor/scan/sized'

export type CV = typeof cvModule

/** Below this lightness, the black body (and its seams). */
const DARK = 60
/** A sticker's area, as a share of the picture's (the frame's): the
 *  thinnest corner's at least, the thickest's at most. */
const SMALLEST = 0.003
const LARGEST = 0.15
/** How much of its box a contour fills to be (nearly) a rectangle. */
const FILL = 0.8

/**
 * The stickers of a mirror cube's face, found off the main thread with
 * OpenCV (lib/editor/scan/sized.ts places them): the light (past the black
 * body) split along every edge Canny finds, so that stickers touching come
 * apart, then each region nearly a rectangle kept; then the light whole,
 * for a sticker an inner edge broke (a scratch, ink, a glint), where no
 * other is. Regions touching the picture's border are the background.
 */
export function stickersOf(cv: CV, width: number, height: number, rgba: Uint8ClampedArray): Rect[] {
  const image = cv.matFromImageData({ width, height, data: rgba } as ImageData)
  const gray = new cv.Mat()
  cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY)
  const blur = new cv.Mat()
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0)
  const edges = new cv.Mat()
  cv.Canny(blur, edges, 40, 120)
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U)
  cv.dilate(edges, edges, kernel)
  const whole = new cv.Mat()
  cv.threshold(blur, whole, DARK, 255, cv.THRESH_BINARY)
  const notEdges = new cv.Mat()
  cv.bitwise_not(edges, notEdges)
  const split = new cv.Mat()
  cv.bitwise_and(whole, notEdges, split)
  const area = width * height
  const regions = (mask: InstanceType<CV['Mat']>): Rect[] => {
    const contours = new cv.MatVector()
    const hierarchy = new cv.Mat()
    // Every region, the stickers nested in the background's hole too.
    cv.findContours(mask, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
    const out: Rect[] = []
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i)
      const a = cv.contourArea(c)
      const { x, y, width: w, height: h } = cv.boundingRect(c)
      const inside = x > 2 && y > 2 && x + w < width - 2 && y + h < height - 2
      if (inside && a > SMALLEST * area && a < LARGEST * area && a / (w * h) > FILL)
        out.push([x, y, w, h])
      c.delete()
    }
    contours.delete()
    hierarchy.delete()
    return out
  }
  const overlaps = (a: Rect, b: Rect) =>
    a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3]
  const found = regions(split)
  for (const r of regions(whole)) if (!found.some((o) => overlaps(o, r))) found.push(r)
  for (const m of [image, gray, blur, edges, kernel, whole, notEdges, split]) m.delete()
  return found
}
