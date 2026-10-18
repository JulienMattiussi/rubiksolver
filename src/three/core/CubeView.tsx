import { cubeDims } from '@/lib/core/cube'
import { useCube } from '@/store/cubeStore'
import { useMemo } from 'react'
import { CubeModel } from './CubeModel'
import { boxHull } from './hull'
import { visualPosition } from './layout'
import { TutorialArrow } from './TutorialArrow'
import { useTurnAnimation } from './useTurnAnimation'
import { useTutorialScene } from './useTutorialScene'

/** The scene's grid puzzle, animated from the store's queue (see
 *  useTurnAnimation). While a pad button is hovered, the pieces its turn
 *  would move are highlighted. In the tutorial, its formula's piece is
 *  highlighted with an arrow to its place, the pieces it moves though not
 *  placed yet are hatched, and a click picks a piece or its place (see
 *  useTutorialScene). */
export function CubeView() {
  const cube = useCube((s) => s.cube)
  const variant = useCube((s) => s.variant)
  const { groupRef, isTurning, halfRef, isHalfTurning, turnSpin, progress } = useTurnAnimation()
  const { model, arrows, fade } = useTutorialScene(cube)
  const dims = cubeDims(cube)
  const [dx, dy, dz] = dims
  const hull = useMemo(() => boxHull([dx / 2, dy / 2, dz / 2]), [dx, dy, dz])
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
      {...model}
    >
      {arrows.map((path, i) => (
        <TutorialArrow
          key={i}
          from={visualPosition(path.from, dims)}
          fromNormal={path.fromNormal}
          to={visualPosition(path.to, dims)}
          toNormal={path.toNormal}
          hull={hull}
          fade={fade?.(i)}
        />
      ))}
    </CubeModel>
  )
}
