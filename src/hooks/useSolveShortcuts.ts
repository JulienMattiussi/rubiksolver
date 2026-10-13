import { useEffect } from 'react'

/** What the solve block can do right now, and how. */
export interface SolveKeys {
  /** Whether the keys apply at all (a puzzle on screen, nothing being entered). */
  readonly enabled: boolean
  readonly canBack: boolean
  readonly canAhead: boolean
  /** A solution is playing (Space pauses it). */
  readonly playing: boolean
  /** The rest of the solution can be played (Enter, or Space when paused). */
  readonly canSolve: boolean
  readonly nextMove: () => void
  readonly undoMove: () => void
  readonly nextStep: () => void
  readonly undoStep: () => void
  readonly solveAll: () => void
  readonly pause: () => void
}

/** Whether a key press belongs to something else: a field being typed in,
 *  a select, an open dialog. */
function elsewhere(event: KeyboardEvent): boolean {
  const target = event.target
  if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]'))
    return true
  return document.querySelector('[aria-modal="true"]') !== null
}

/**
 * The solution's keyboard: right and left arrows a move ahead or back, Page
 * Down and Page Up a step, Space pauses or resumes, Enter plays the rest;
 * the left arrow and Page Up also stop a solution playing, then go back
 * (its last move, its step).
 * Space and Enter are taken over even on a focused button (the shortcut,
 * not the button, is what one means there).
 */
export function useSolveShortcuts(keys: SolveKeys) {
  useEffect(() => {
    if (!keys.enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || elsewhere(event)) return
      const act = (allowed: boolean, action: () => void) => {
        event.preventDefault()
        if (allowed) action()
      }
      // Going back while playing stops there first, then goes back from
      // where the move under way leaves the solution.
      const back = (action: () => void) =>
        keys.playing
          ? act(true, () => {
              keys.pause()
              action()
            })
          : act(keys.canBack, action)
      switch (event.key) {
        case 'ArrowRight':
          return act(keys.canAhead, keys.nextMove)
        case 'ArrowLeft':
          return back(keys.undoMove)
        case 'PageDown':
          return act(keys.canAhead, keys.nextStep)
        case 'PageUp':
          return back(keys.undoStep)
        case ' ':
          return keys.playing ? act(true, keys.pause) : act(keys.canSolve, keys.solveAll)
        case 'Enter':
          return act(keys.canSolve && !keys.playing, keys.solveAll)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keys])
}
