import { useMemo } from 'react'
import { cubeShape } from '@/lib/core/cube'
import { normalIndex } from '@/lib/core/geometry'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Cubie, Vec3 } from '@/lib/core/types'
import type { Arrow } from '@/lib/teach/scene'
import { useCube } from '@/store/cubeStore'
import { PolyModel } from './PolyModel'
import { polyDrawing, type PolyDrawing } from './polyDrawing'
import { TutorialArrow } from './TutorialArrow'
import { useTurnAnimation } from './useTurnAnimation'
import { useTutorialScene } from './useTutorialScene'

type V3 = [number, number, number]

/** A piece's sticker facing `normal` as drawn: its center, and its
 *  outward normal in the drawing (null: none). */
function stickerFace(
  drawing: PolyDrawing,
  cubie: Cubie,
  normal: Vec3,
): { center: V3; normal: V3 } | null {
  const ni = normalIndex(normal)
  const polygons = drawing.polygons(cubie).filter((p) => p.paint !== 'body' && p.ni === ni)
  const points = polygons.flatMap((p) => p.points)
  if (points.length === 0) return null
  const center = [0, 1, 2].map((a) => points.reduce((sum, p) => sum + p[a]!, 0) / points.length)
  return { center: center as V3, normal: [...polygons[0]!.normal] as V3 }
}

/** Half the sides of the box the puzzle's drawing fills. */
function halfBox(drawing: PolyDrawing, cube: Cube): V3 {
  const points = cube.flatMap((c) => drawing.polygons(c).flatMap((p) => p.points))
  return [0, 1, 2].map((a) => Math.max(...points.map((p) => Math.abs(p[a]!)))) as V3
}

/** The scene's gridless puzzle (a star prism, the Pyraminx), animated like
 *  the cubes, the tutorial showing on it as on them (useTutorialScene): an
 *  arrow goes from a sticker's center, as drawn, to where it lands. */
export function PolyView() {
  const cube = useCube((s) => s.cube)
  const { groupRef, isTurning } = useTurnAnimation()
  const { model, arrows, moves, fade } = useTutorialScene(cube)
  const drawing = polyDrawing(cubeShape(cube))
  const half = useMemo(() => halfBox(drawing, cube), [drawing, cube])
  const after = useMemo(
    () => (arrows.length && moves ? applyMoves(cube, moves) : null),
    [arrows.length, moves, cube],
  )
  const ends = (arrow: Arrow) => {
    const from = stickerFace(drawing, cube[arrow.piece]!, arrow.fromNormal)
    const to = after && stickerFace(drawing, after[arrow.piece]!, arrow.toNormal)
    return from && to ? { from, to } : null
  }
  return (
    <PolyModel cube={cube} groupRef={groupRef} isTurning={isTurning} {...model}>
      {arrows.map((arrow, i) => {
        const at = ends(arrow)
        return at ? (
          <TutorialArrow
            key={i}
            from={at.from.center}
            fromNormal={at.from.normal}
            to={at.to.center}
            toNormal={at.to.normal}
            half={half}
            onFace
            fade={fade?.(i)}
          />
        ) : null
      })}
    </PolyModel>
  )
}
