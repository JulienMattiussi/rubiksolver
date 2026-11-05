import { COLOR_HEX } from '@/lib/core/stickerColors'
import type { Color } from '@/lib/core/types'
import type { Rect } from '@/lib/editor/scan/sized'
import type { FaceImage } from '@/workers/findStickers'

/**
 * The scan debugged (`?scandebug` in the address): the cells' measures
 * written in them (ScanView), the scan's in the console, and its pictures
 * downloaded, to replay a reading that went wrong.
 */

const DEBUG = 'scandebug'

/** `scandebug` anywhere in the address as the page loads (before or after
 *  its `#`, which the router then rewrites): kept for the tab's session. */
export function rememberScanDebug(): void {
  try {
    if (window.location.href.includes(DEBUG)) sessionStorage.setItem(DEBUG, '1')
  } catch {
    // No storage (a private window): the address alone says it.
  }
}

/** Whether the scan is debugged. */
export function scanDebug(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.location.href.includes(DEBUG) || sessionStorage.getItem(DEBUG) === '1'
  } catch {
    return window.location.href.includes(DEBUG)
  }
}

/** A canvas downloaded as a PNG. */
function download(canvas: HTMLCanvasElement, name: string): void {
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `${name}-${Date.now()}.png`
  link.click()
}

/** A face read whole (outlines.ts), debugged: the very picture read, to
 *  replay its reading in a test. */
export function savePicture(canvas: HTMLCanvasElement, name: string): void {
  if (scanDebug()) download(canvas, name)
}

/** A face whose stickers were looked for, as read. */
export interface ReadFace {
  readonly image: FaceImage | undefined
  /** Where the frame shown lay in it. */
  readonly frame?: Rect
  readonly rects: readonly Rect[]
  /** Each sticker's color, as read (none yet: a face refused as taken). */
  readonly colors: readonly Color[]
}

/** Room between two faces, and over them for their number. */
const GAP = 16
const TITLE = 36

/** A puzzle read from its stickers (read as canvases), debugged: its faces
 *  side by side in one PNG, as taken, and below, each sticker found
 *  outlined in the color read, its letter on it, the frame shown dashed
 *  (the pictures as taken, to replay the search on). */
export function saveReading(faces: readonly ReadFace[], name: string): void {
  if (!scanDebug()) return
  const width = faces.reduce((a, f) => a + (f.image?.width ?? 0) + GAP, GAP)
  const row = TITLE + Math.max(0, ...faces.map((f) => f.image?.height ?? 0))
  const height = 2 * row + GAP
  const canvas = Object.assign(document.createElement('canvas'), { width, height })
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, width, height)
  let x = GAP
  faces.forEach(({ image, frame, rects, colors }, f) => {
    if (!image) return
    const data = new ImageData(new Uint8ClampedArray(image.rgba), image.width, image.height)
    ctx.putImageData(data, x, TITLE)
    ctx.putImageData(data, x, row + TITLE)
    ctx.font = 'bold 24px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`Face ${f + 1}`, x, TITLE - 10)
    // The annotated row, below the pictures as taken.
    ctx.translate(0, row)
    if (frame) {
      ctx.setLineDash([10, 8])
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(x + frame[0], TITLE + frame[1], frame[2], frame[3])
      ctx.setLineDash([])
    }
    rects.forEach(([rx, ry, rw, rh], i) => {
      const color = colors[i]
      ctx.strokeStyle = color ? COLOR_HEX[color] : '#ff0000'
      ctx.lineWidth = 5
      ctx.strokeRect(x + rx, TITLE + ry, rw, rh)
      ctx.fillStyle = '#000000'
      ctx.fillRect(x + rx + 4, TITLE + ry + 4, 30, 30)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(color ?? '?', x + rx + 10, TITLE + ry + 28)
    })
    ctx.translate(0, -row)
    x += image.width + GAP
  })
  download(canvas, name)
}
