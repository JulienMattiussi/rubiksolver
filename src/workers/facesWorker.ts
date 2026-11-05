// The engine first, as in the app: the models it reads while it loads are
// then ready (imported first, the models would reach it half loaded).
import '@/lib/core/cube'
import { facesOf } from './findFaces'
import type { Nearest, Views } from '@/lib/editor/modes/faceViews'
import type { CubeShape } from '@/lib/core/shapes'

/** A puzzle's four faces entered, to find its state from. */
export interface FacesRequest {
  readonly id: number
  readonly shape: CubeShape
  readonly views: Views
  /** The nearest states, none showing them exactly (`FaceEntry.near`). */
  readonly near?: boolean
}

export interface FacesResponse extends Nearest {
  readonly id: number
}

/** Finds a puzzle's state from its faces off the main thread: the
 *  Camouflage's search takes some 100 ms, a few seconds at worst; the
 *  Meffert's Pocket Cube's index is built once, in about a second (lib/editor/modes/faceViews.ts).
 *  The states the faces show, however held (none if none; `off` empty), or
 *  the nearest. */
self.onmessage = ({ data }: MessageEvent<FacesRequest>) => {
  let found: Nearest = { found: [], off: [] }
  try {
    found = facesOf(data.shape, data.views, data.near)
  } catch {
    // None found.
  }
  self.postMessage({ id: data.id, ...found } satisfies FacesResponse)
}
