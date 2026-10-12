import { cubeShape } from '@/lib/cube'
import { methodsFor, type MethodId, type SolveStep } from '@/lib/solver'
import type { Cube } from '@/lib/types'

/** A solution to compute: the state, its method, and the request it answers. */
export interface SolveRequest {
  readonly id: number
  readonly cube: Cube
  readonly method: MethodId
}

export interface SolveResponse {
  readonly id: number
  /** The steps, or null when the method could not solve it. */
  readonly steps: SolveStep[] | null
}

/** Solves off the main thread, so a slow method (the 4x4's reduction) never
 *  freezes the page while the plan is computed ahead (useAutoPlan). */
self.onmessage = ({ data }: MessageEvent<SolveRequest>) => {
  let steps: SolveStep[] | null = null
  try {
    const methods = methodsFor(cubeShape(data.cube))
    const method = methods.find((m) => m.id === data.method) ?? methods[0]
    steps = method ? method.solve(data.cube) : null
  } catch {
    steps = null
  }
  self.postMessage({ id: data.id, steps } satisfies SolveResponse)
}
