import { useFrame } from '@react-three/fiber'
import { useCallback, useState } from 'react'
import { easeInOut } from '@/lib/app/easing'

/** Seconds an arrow takes to show, stays shown, and takes to go; the next
 *  shows as it goes. */
const SHOW = 1
const STAY = 0.4
const TURN = SHOW + STAY

/**
 * Arrows taking turns, one shown at a time (a single arrow stays): which
 * is shown now, and how much each shows at a time (`fade`, null for a
 * single arrow). Each comes in, stays, and goes while the next comes in.
 */
export function useArrowTurns(count: number): {
  current: number
  fade: ((index: number) => (seconds: number) => number) | null
} {
  const [current, setCurrent] = useState(0)
  useFrame(({ clock }) => {
    const now = count > 1 ? Math.floor(clock.elapsedTime / TURN) % count : 0
    if (now !== current) setCurrent(now)
  })
  const fade = useCallback(
    (index: number) => (seconds: number) => {
      const p = (((seconds - index * TURN) % (count * TURN)) + count * TURN) % (count * TURN)
      // Eased in and out: it comes in softly, and goes the same way.
      if (p < SHOW) return easeInOut(p / SHOW)
      if (p < TURN) return 1
      if (p < TURN + SHOW) return 1 - easeInOut((p - TURN) / SHOW)
      return 0
    },
    [count],
  )
  return { current: count > 1 ? current % count : 0, fade: count > 1 ? fade : null }
}
