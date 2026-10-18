import type { Cube, Turn } from '@/lib/core/types'
import { arrowsOf, type Arrow } from '@/lib/teach/scene'
import { useTutorial } from '@/hooks/useTutorial'
import { useView } from '@/store/viewStore'
import type { ModelProps } from './CubeModel'
import { useArrowTurns } from './useArrowTurns'
import { usePreviewed } from './usePreviewed'

/**
 * How the tutorial shows on the puzzle, whatever draws it (cubies or
 * polygons): the pieces lit, hatched and marked, their glow pulsing, a
 * click picking a piece or its place (the model's props), and the arrows
 * (the pick's marker sticker to where the formula takes it, or each piece
 * the step works on to its place), taking turns when several. Off the
 * tutorial, a pad button hovered lights its turn's pieces.
 */
export function useTutorialScene(cube: Cube): {
  model: Pick<ModelProps, 'highlighted' | 'hatched' | 'marked' | 'pulse' | 'onPick'>
  arrows: readonly Arrow[]
  /** The formula the arrows are for (where they land). */
  moves: readonly Turn[] | null
  fade: ((index: number) => (seconds: number) => number) | null
} {
  const previewed = usePreviewed()
  const previewing = useView((s) => s.preview) !== null
  const tutorial = useTutorial()
  const { tones, pick, moves, step } = tutorial
  const arrows = tones && !tutorial.review && step && moves ? arrowsOf(cube, moves, step, pick) : []
  // Several arrows take turns; the one shown says which pieces stand out:
  // its piece (blue) and the one where it lands (amber).
  const { current, fade } = useArrowTurns(arrows.length)
  const shown = !pick ? arrows[current] : undefined
  // Looking at a figure's formula played: the pieces it moved, where they
  // went, stand out (as a piece placed does).
  const moved =
    tutorial.review && !pick && step && moves
      ? new Set(arrowsOf(tutorial.cube, moves, step, null).map((p) => p.piece))
      : null
  const lands = (i: number) =>
    !!shown && i !== shown.piece && cube[i]!.position.join() === shown.to.join()
  return {
    model: {
      // A pad button hovered (the tutorial's too) shows its turn's pieces.
      highlighted:
        tones && !previewing
          ? (i) => tones[i] === 'target' || i === shown?.piece || !!moved?.has(i)
          : previewed,
      // The piece standing where the pick goes is moved aside too: hatched
      // as well as marked. On a word of the glossary, every piece it does
      // not name is hatched, the named ones standing out.
      ...(tones && {
        hatched: (i: number) =>
          step?.kind === 'term'
            ? tones[i] !== 'target'
            : tones[i] === 'moved' || tones[i] === 'slot',
        marked: (i: number) => tones[i] === 'slot' || lands(i),
      }),
      pulse: !!tones,
      ...(tutorial.step && { onPick: tutorial.click }),
    },
    arrows,
    moves,
    fade,
  }
}
