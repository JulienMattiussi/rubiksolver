import { useEffect, useState } from 'react'

/** How long the cards stay open on arrival without a gesture (ms). */
const READ_FOR = 8000

/** Whether the page's arrival has been shown already: once per visit, not
 *  again for each puzzle chosen afterwards. */
let arrived = false

/**
 * Whether the page has just been reached: true from its first render until
 * the reader's first gesture (a click, a key, the wheel) or `READ_FOR` ms,
 * so that the puzzle's page is read open first (AboutCards), then folds
 * back as the reader starts playing.
 */
export function useArrival(): boolean {
  const [arriving, setArriving] = useState(() => !arrived)
  useEffect(() => {
    if (!arriving) return
    arrived = true
    const done = () => setArriving(false)
    const timer = setTimeout(done, READ_FOR)
    const events = ['pointerdown', 'keydown', 'wheel'] as const
    for (const event of events) window.addEventListener(event, done, { once: true })
    return () => {
      clearTimeout(timer)
      for (const event of events) window.removeEventListener(event, done)
    }
  }, [arriving])
  return arriving
}
