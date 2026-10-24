import type { Rect } from '@/lib/editor/scan/sized'
import type { StickersRequest, StickersResponse } from './stickersWorker'

/** A face's picture, as a canvas gives it. */
export interface FaceImage {
  readonly width: number
  readonly height: number
  readonly rgba: Uint8ClampedArray
}

let worker: Worker | null = null
let lastId = 0
const waiting = new Map<number, (rects: Rect[]) => void>()

const ask = (request: (id: number) => StickersRequest): Promise<Rect[]> => {
  if (typeof Worker === 'undefined') return Promise.resolve([])
  if (!worker) {
    worker = new Worker(new URL('./stickersWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: MessageEvent<StickersResponse>) => {
      waiting.get(data.id)?.(data.rects)
      waiting.delete(data.id)
    }
  }
  const id = ++lastId
  return new Promise((resolve) => {
    waiting.set(id, resolve)
    worker!.postMessage(request(id))
  })
}

/** The stickers found on a mirror cube's face (stickersWorker.ts). */
export const findStickers = ({ width, height, rgba }: FaceImage): Promise<Rect[]> =>
  ask((id) => ({ id, width, height, rgba }))

/** OpenCV loaded ahead in the worker (some 3 MB, then cached), so that a
 *  scan never waits for it. */
export const warmStickers = (): void => void ask((id) => ({ id, warm: true }))
