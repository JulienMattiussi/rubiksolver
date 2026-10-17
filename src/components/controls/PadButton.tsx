import { useEffect } from 'react'
import type { Turn } from '@/lib/core/types'
import { useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { Button } from '@/components/ui/Button'

interface PadButtonProps {
  /** The turn it makes, or null when the layer does not exist here. */
  move: Turn | null
  label: string
  title: string
  disabled: boolean
  /** The second of a pair (the opposite turn): outlined, not filled. */
  ghost?: boolean
  compact?: boolean
  /** Short and narrow: a move in a list (the tutorial's formula). */
  dense?: boolean
}

/**
 * A rotation pad button: a click queues its turn, and hovering or focusing it
 * highlights the pieces the turn would move (viewStore.preview). The wrapper
 * hears the pointer even while the button is disabled, so the highlight never
 * sticks once a click starts the animation.
 */
export function PadButton({ move, label, title, disabled, ghost, compact, dense }: PadButtonProps) {
  const pushMove = useCube((s) => s.pushMove)
  const setPreview = useView((s) => s.setPreview)
  // Never leave a highlight behind: the pad changes with the puzzle.
  useEffect(() => () => setPreview(null), [setPreview])
  const show = () => setPreview(move)
  const hide = () => setPreview(null)
  return (
    <div className="flex flex-1" onPointerEnter={show} onPointerLeave={hide}>
      <Button
        disabled={disabled || !move}
        onFocus={show}
        onBlur={hide}
        onClick={() => move && pushMove(move)}
        variant={ghost ? 'ghost' : undefined}
        className={`flex-1 rounded-none whitespace-nowrap ${
          dense ? 'h-7 px-0 py-0! text-xs' : compact ? 'px-0 text-xs tracking-tight' : 'px-2'
        }`}
        aria-label={title}
        title={title}
      >
        {label}
      </Button>
    </div>
  )
}
