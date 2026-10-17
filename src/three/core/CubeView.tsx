import { cubeDims } from '@/lib/core/cube'
import { arrowsOf } from '@/lib/tutorial/tutorial'
import { useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { useTutorial } from '@/hooks/useTutorial'
import { CubeModel } from './CubeModel'
import { visualPosition } from './layout'
import { TutorialArrow } from './TutorialArrow'
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
      highlighted={tones && !previewing ? (i) => tones[i] === 'target' : previewed}
      hatched={tones ? (i) => tones[i] === 'moved' : undefined}
      marked={tones ? (i) => tones[i] === 'slot' : undefined}
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
        />
      ))}
    </CubeModel>
  )
}
