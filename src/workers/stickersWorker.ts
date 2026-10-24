import cvModule from '@techstark/opencv-js'
import type { Rect } from '@/lib/editor/scan/sized'
import { stickersOf, type CV } from './stickers'

/** A face's picture to find the stickers of, or a request to load OpenCV
 *  ahead (`warm`, as soon as a mirror cube shows). */
export type StickersRequest =
  | { readonly id: number; readonly warm: true }
  | {
      readonly id: number
      readonly width: number
      readonly height: number
      readonly rgba: Uint8ClampedArray
    }

export interface StickersResponse {
  readonly id: number
  /** The rectangles found (none while warming, or if OpenCV failed). */
  readonly rects: Rect[]
}

// The module is a thenable resolving to itself: awaited as is, it never
// settles. Loaded once, when the worker starts.
const ready: Promise<CV> = new Promise((resolve) =>
  (cvModule as unknown as { then: (f: (cv: CV) => void) => void }).then((cv) => {
    delete (cv as unknown as { then?: unknown }).then
    resolve(cv)
  }),
)

self.onmessage = async ({ data }: MessageEvent<StickersRequest>) => {
  let rects: Rect[] = []
  try {
    const cv = await ready
    if (!('warm' in data)) rects = stickersOf(cv, data.width, data.height, data.rgba)
  } catch {
    rects = []
  }
  self.postMessage({ id: data.id, rects } satisfies StickersResponse)
}
