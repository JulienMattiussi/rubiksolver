import { MODELS } from '@/lib/puzzles/models'
import type { Found, Views } from '@/lib/puzzles/shared/faceViews'
import type { CubeShape } from '@/lib/core/types'
import type { FacesRequest, FacesResponse } from './facesWorker'

let worker: Worker | null = null
let lastId = 0
const waiting = new Map<number, (found: Found[]) => void>()

/** The states a puzzle's four faces show (its model's `entry.faces.find`),
 *  found in a worker; at once where there is none (tests). */
export function findFaces(shape: CubeShape, views: Views): Promise<Found[]> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve(MODELS[shape]?.entry?.faces?.find(views) ?? [])
  }
  if (!worker) {
    worker = new Worker(new URL('./facesWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: MessageEvent<FacesResponse>) => {
      waiting.get(data.id)?.(data.found)
      waiting.delete(data.id)
    }
  }
  const id = ++lastId
  return new Promise((resolve) => {
    waiting.set(id, resolve)
    worker!.postMessage({ id, shape, views } satisfies FacesRequest)
  })
}
