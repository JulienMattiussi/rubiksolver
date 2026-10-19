// The engine first, as in the app: the models it reads while it loads are
// then ready (imported first, the models would reach it half loaded).
import '@/lib/core/cube'
import { stepOf } from '@/lib/editor/entry'
import type { Found, Views } from '@/lib/editor/modes/faceViews'
import type { CubeShape } from '@/lib/core/types'

/** A puzzle's four faces entered, to find its state from. */
export interface FacesRequest {
  readonly id: number
  readonly shape: CubeShape
  readonly views: Views
}

export interface FacesResponse {
  readonly id: number
  /** The states the faces show, however held (none if none). */
  readonly found: Found[]
}

/** Finds a puzzle's state from its faces off the main thread: the
 *  Camouflage's search takes some 100 ms, a few seconds at worst; the
 *  Purple's index is built once, in about a second (lib/editor/modes/faceViews.ts). */
self.onmessage = ({ data }: MessageEvent<FacesRequest>) => {
  let found: Found[] = []
  try {
    found = stepOf(data.shape, 'canvas')?.faces.find(data.views) ?? []
  } catch {
    found = []
  }
  self.postMessage({ id: data.id, found } satisfies FacesResponse)
}
