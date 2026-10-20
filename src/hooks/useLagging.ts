import { useEffect, useState } from 'react'

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true

/** A flag that turns on `ms` after `on` does (at once where motion is
 *  reduced), and off with it: what plays out first meanwhile (a phone's
 *  panel going down before it folds to its bar). */
export function useLagging(on: boolean, ms: number): boolean {
  const [shown, setShown] = useState(on)
  useEffect(() => {
    // Off, reset for the next time; on, after the wait.
    const timer = setTimeout(() => setShown(on), on && !reduced() ? ms : 0)
    return () => clearTimeout(timer)
  }, [on, ms])
  return on && shown
}
