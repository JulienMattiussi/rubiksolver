import type { Found, Nearest, Views } from '@/lib/editor/modes/faceViews'
import type { CubeShape } from '@/lib/core/shapes'
import { stepOf } from '@/lib/editor/entry'
import type { FacesRequest, FacesResponse } from './facesWorker'

let worker: Worker | null = null
let lastId = 0
const waiting = new Map<number, (found: Nearest) => void>()

/** The states some faces show, or the nearest (`near`), here and now. */
export function facesOf(shape: CubeShape, views: Views, near = false): Nearest {
  const entry = stepOf(shape, 'canvas')?.faces
  if (near) return entry?.near?.(views) ?? { found: [], off: [] }
  return { found: entry?.find(views) ?? [], off: [] }
}

/** The states a puzzle's four faces show (its model's canvas step's
 *  `find`), or the nearest (`near`), found in a worker; at once where there
 *  is none (tests). */
function ask(shape: CubeShape, views: Views, near: boolean): Promise<Nearest> {
  if (typeof Worker === 'undefined') return Promise.resolve(facesOf(shape, views, near))
  if (!worker) {
    worker = new Worker(new URL('./facesWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data: { id, ...found } }: MessageEvent<FacesResponse>) => {
      waiting.get(id)?.(found)
      waiting.delete(id)
    }
  }
  const id = ++lastId
  return new Promise((resolve) => {
    waiting.set(id, resolve)
    worker!.postMessage({ id, shape, views, near } satisfies FacesRequest)
  })
}

/** The states a puzzle's four faces show, however held. */
export const findFaces = (shape: CubeShape, views: Views): Promise<Found[]> =>
  ask(shape, views, false).then(({ found }) => found)

/** The states nearest a puzzle's four faces read, and how far each face is
 *  from theirs (`FaceEntry.near`). */
export const findNearest = (shape: CubeShape, views: Views): Promise<Nearest> =>
  ask(shape, views, true)
