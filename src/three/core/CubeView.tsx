import { cubeDims } from '@/lib/core/cube'
import { arrowsOf } from '@/lib/tutorial/scene'
import { useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { useTutorial } from '@/hooks/useTutorial'
import { CubeModel } from './CubeModel'
import { visualPosition } from './layout'
import { TutorialArrow } from './TutorialArrow'
import { useArrowTurns } from './useArrowTurns'
import { usePreviewed } from './usePreviewed'
import { useTurnAnimation } from './useTurnAnimation'

/** The scene's grid puzzle, animated from the store's queue (see
 *  useTurnAnimation). While a pad button is hovered, the pieces its turn
 *  would move are highlighted. In the tutorial, its formula's piece is
 *  highlighted with an arrow to its place, the pieces it moves though not
 *  placed yet are hatched, and a click picks a piece or its place. */
export function CubeView() {
  const cube = useCube((s) => s.cube)
  const variant = useCube((s) => s.variant)
  const { groupRef, isTurning, halfRef, isHalfTurning, turnSpin, progress } = useTurnAnimation()
  const previewed = usePreviewed()
  const previewing = useView((s) => s.preview) !== null
  const tutorial = useTutorial()
  const { tones, pick, moves, step } = tutorial
  const dims = cubeDims(cube)
  // The arrows: the pick's marker sticker to where the formula takes it,
  // or each piece the step works on to its place.
  const paths = tones && !tutorial.review && step && moves ? arrowsOf(cube, moves, step, pick) : []
  // Several arrows take turns; the one shown says which pieces stand out:
  // its piece (blue) and the one where it lands (amber).
  const { current, fade } = useArrowTurns(paths.length)
  const shown = !pick ? paths[current] : undefined
  // Looking at a figure's formula played: the pieces it moved, where they
  // went, stand out (as a piece placed does).
  const moved =
    tutorial.review && !pick && step && moves
      ? new Set(arrowsOf(tutorial.cube, moves, step, null).map((p) => p.piece))
      : null
  const lands = (i: number) =>
    !!shown && i !== shown.piece && cube[i]!.position.join() === shown.to.join()
  return (
    <CubeModel
      cube={cube}
      variant={variant}
      groupRef={groupRef}
      isTurning={isTurning}
      halfRef={halfRef}
      isHalfTurning={isHalfTurning}
      turnSpin={turnSpin}
      progress={progress}
      // A pad button hovered (the tutorial's too) shows its turn's pieces.
      highlighted={
        tones && !previewing
          ? (i) => tones[i] === 'target' || i === shown?.piece || !!moved?.has(i)
          : previewed
      }
      hatched={tones ? (i) => tones[i] === 'moved' : undefined}
      marked={tones ? (i) => tones[i] === 'slot' || lands(i) : undefined}
      pulse={!!tones}
      onPick={tutorial.step ? tutorial.click : undefined}
    >
      {paths.map((path, i) => (
        <TutorialArrow
          key={i}
          from={visualPosition(path.from, dims)}
          fromNormal={path.fromNormal}
          to={visualPosition(path.to, dims)}
          toNormal={path.toNormal}
          fade={fade?.(i)}
        />
      ))}
    </CubeModel>
  )
}
