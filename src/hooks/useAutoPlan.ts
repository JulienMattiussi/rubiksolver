import { useEffect } from 'react'
import { isSolved } from '@/lib/cube'
import type { SolveRequest, SolveResponse } from '@/workers/solveWorker'
import { planKey, selectBusy, useCube } from '@/store/cubeStore'

/** Wait after the cube settles before computing (a burst of turns: once). */
const SETTLE_MS = 150

let worker: Worker | null = null
let lastId = 0
/** The key each pending request was made for. */
const pending = new Map<number, string>()

function solver(): Worker | null {
  if (typeof Worker === 'undefined') return null // tests, old browsers: on click
  if (!worker) {
    worker = new Worker(new URL('../workers/solveWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: MessageEvent<SolveResponse>) => {
      const key = pending.get(data.id)
      pending.delete(data.id)
      if (key && data.steps) useCube.getState().setPlan(data.steps, key)
    }
  }
  return worker
}

/**
 * Computes the chosen method's solution as soon as the cube stands still,
 * in a worker, so the steps show their real moves before Solve or Step by
 * step is clicked (which then reuse them). A newer state simply makes an
 * older answer stale: `setPlan` only takes the one for the current state.
 */
export function useAutoPlan(): void {
  const cube = useCube((s) => s.cube)
  const method = useCube((s) => s.method)
  const busy = useCube(selectBusy)
  const planned = useCube((s) => s.steps !== null)

  useEffect(() => {
    if (busy || planned || isSolved(cube)) return
    const timer = setTimeout(() => {
      const target = solver()
      if (!target) return
      const id = ++lastId
      pending.set(id, planKey({ cube, method }))
      target.postMessage({ id, cube, method } satisfies SolveRequest)
    }, SETTLE_MS)
    return () => clearTimeout(timer)
  }, [cube, method, busy, planned])
}
