import { cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/notation'
import { type Turn } from '@/lib/core/types'
import { SHAPE_DIMS } from '@/lib/core/shapes'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { PadButton } from './PadButton'

interface TurnButtonOptions {
  /** The second of a pair (the opposite turn). */
  readonly ghost?: boolean
  readonly compact?: boolean
  /** The turn played, when not the one shown (held another way: the
   *  tutorial's, useHeldTurn). */
  readonly played?: Turn
  /** Jammed here (a turn the state does not let through). */
  readonly off?: boolean
}

/** A pad's button for a turn, written in the chosen notation as the puzzle
 *  writes it: what every pad of turns is made of. */
export function useTurnButton(disabled: boolean) {
  const labels = useI18n(selectMoveLabels)
  const shape = useCube((s) => cubeShape(s.cube))
  return (move: Turn, title: string, { ghost, compact, played, off }: TurnButtonOptions = {}) => {
    const label = formatMove(move, labels, SHAPE_DIMS[shape], shape)
    return (
      <PadButton
        key={label}
        move={played ?? move}
        label={label}
        title={title}
        disabled={disabled || !!off}
        ghost={ghost}
        compact={compact}
      />
    )
  }
}
