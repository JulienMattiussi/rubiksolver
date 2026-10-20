import { useEffect } from 'react'
import { elsewhere } from './useSolveShortcuts'

/** What the tutorial's two buttons do right now (none: off). */
export interface TutorialKeys {
  /** On: Next, applying the formula, finishing it. */
  readonly ahead?: () => void
  /** Back: undoing the move, back to the words, the word before. */
  readonly back?: () => void
}

/**
 * The tutorial's keyboard: Space or the right arrow press its button on,
 * the left arrow or Backspace its button back. Taken over even on a
 * focused button (the shortcut, not the button, is what one means there).
 */
export function useTutorialShortcuts(keys: TutorialKeys) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || elsewhere(event)) return
      const action =
        event.key === ' ' || event.key === 'ArrowRight'
          ? keys.ahead
          : event.key === 'ArrowLeft' || event.key === 'Backspace'
            ? keys.back
            : null
      if (action === null) return
      event.preventDefault()
      action?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keys])
}
