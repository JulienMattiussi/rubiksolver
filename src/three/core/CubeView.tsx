import { cubeDims } from '@/lib/core/cube'
import { LAYER_THICKNESS } from '@/lib/core/shape'
import { applyMoves } from '@/lib/core/turn'
import { useCube } from '@/store/cubeStore'
import { useMemo } from 'react'
import { CubeModel } from './CubeModel'
import { cubiesHull, faceCenter } from './hull'
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
  const { model, arrows, moves, fade } = useTutorialScene(cube)
  const dims = cubeDims(cube)
  // The arrows go from face to face as drawn (a mirror cube's pieces each
  // their size): the piece's, to the one standing where it lands now (what
  // shows there; its own once the formula is played if none does), round
  // the pieces as they stand, bumps and all.
  const thickness = LAYER_THICKNESS[variant]
  const after = useMemo(() => (moves ? applyMoves(cube, moves) : cube), [cube, moves])
  const hull = useMemo(() => cubiesHull(cube, dims, thickness), [cube, dims, thickness])
  const landing = (piece: number, at: readonly number[]) =>
    cube.find((c) => c.position.join() === at.join()) ?? after[piece]!
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
          from={faceCenter(cube[path.piece]!, path.fromNormal, dims, thickness)}
          fromNormal={path.fromNormal}
          to={faceCenter(landing(path.piece, path.to), path.toNormal, dims, thickness)}
          toNormal={path.toNormal}
          hull={hull}
          onFace
          fade={fade?.(i)}
        />
      ))}
    </CubeModel>
  )
}
