import { useEffect, useSyncExternalStore } from 'react'
import { isSolved } from '@/lib/core/cube'
import type { SolveRequest, SolveResponse } from '@/workers/solveWorker'
import { planKey, selectBusy, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'

/** Wait after the cube settles before computing (a burst of turns: once). */
const SETTLE_MS = 150

let worker: Worker | null = null
let lastId = 0
/** The key each pending request was made for. */
const pending = new Map<number, string>()

/**
 * What the worker could not give, so the buttons stop waiting for it and
 * compute on click instead: `broken`, a worker that failed to load or crashed;
 * `failedFor`, the plan key it answered nothing for.
 */
let fallback = { broken: false, failedFor: null as string | null }
const listeners = new Set<() => void>()
function setFallback(next: Partial<typeof fallback>): void {
  fallback = { ...fallback, ...next }
  listeners.forEach((listener) => listener())
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function solver(): Worker | null {
  if (typeof Worker === 'undefined' || fallback.broken) return null // tests, old browsers: on click
  if (!worker) {
    worker = new Worker(new URL('../workers/solveWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: MessageEvent<SolveResponse>) => {
      const key = pending.get(data.id)
      pending.delete(data.id)
      // The tutorial shows its own formulas: no solution meanwhile.
      if (useTutorialStore.getState().active) return
      if (key && data.steps) useCube.getState().setPlan(data.steps, key)
      else if (key) setFallback({ failedFor: key })
    }
    worker.onerror = () => {
      worker?.terminate()
      worker = null
      pending.clear()
      setFallback({ broken: true })
    }
  }
  return worker
}

/**
 * Computes the chosen method's solution as soon as the cube stands still,
 * in a worker, so the steps show their real moves before Solve or Step by
 * step is clicked (which then reuse them). A newer state simply makes an
 * older answer stale: `setPlan` only takes the one for the current state.
 * Off (`enabled` false) on the home page, where no puzzle is shown.
 * Returns whether the solution is ready: the solve buttons wait for it
 * (without a worker, or once it failed, it is computed on click, so always).
 */
export function useAutoPlan(enabled = true): boolean {
  const cube = useCube((s) => s.cube)
  const method = useCube((s) => s.method)
  const unlocked = useCube((s) => s.unlocked)
  const busy = useCube(selectBusy)
  const planned = useCube((s) => s.steps !== null)
  const failed = useSyncExternalStore(subscribe, () => fallback)
  const key = planKey({ cube, method })

  // Loaded with the page, while its script is still served: a tab left open
  // across a deploy keeps it (the new deploy no longer serves the old one).
  useEffect(() => void solver(), [])

  useEffect(() => {
    if (!enabled || busy || planned || isSolved(cube)) return
    const timer = setTimeout(() => {
      const target = solver()
      if (!target) return
      const id = ++lastId
      pending.set(id, planKey({ cube, method }))
      target.postMessage({ id, cube, method, unlocked } satisfies SolveRequest)
    }, SETTLE_MS)
    return () => clearTimeout(timer)
  }, [enabled, cube, method, unlocked, busy, planned])
  return planned || typeof Worker === 'undefined' || failed.broken || failed.failedFor === key
}
