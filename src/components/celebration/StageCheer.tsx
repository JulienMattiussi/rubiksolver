import { useEffect, useState } from 'react'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useTutorialTrack } from '@/store/tutorialTrack'

/**
 * A tutorial stage done (`stagesDone`, its last formula validated): a 💪
 * in front of the puzzle, once the formula has played, growing in, beating
 * twice and fading out (`animate-cheer`, index.css). Not the fireworks of
 * a whole solve; skipped for who asks for reduced motion.
 */
export function StageCheer() {
  // Each cheer its own key, so a new one starts afresh.
  const [show, setShow] = useState(0)
  useEffect(() => {
    // A stage done waits for its formula to finish playing.
    let pending = false
    const fire = () => {
      pending = false
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
      setShow((n) => n + 1)
    }
    const stages = useTutorialTrack.subscribe((next, prev) => {
      if (next.stagesDone === prev.stagesDone) return
      pending = true
      if (!selectBusy(useCube.getState())) fire()
    })
    const turns = useCube.subscribe((next) => {
      if (pending && !selectBusy(next)) fire()
    })
    return () => {
      stages()
      turns()
    }
  }, [])
  if (!show) return null
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      <span
        key={show}
        className="animate-cheer text-[9rem] drop-shadow-2xl"
        onAnimationEnd={() => setShow(0)}
      >
        💪
      </span>
    </div>
  )
}
