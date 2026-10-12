import { useMemo } from 'react'
import { cubeShape } from '@/lib/cube'
import type { Cubie } from '@/lib/types'
import type { ModelProps } from './CubeModel'
import { NO_PIECES } from './noPieces'
import { PolyPiece } from './PolyPiece'
import { polyDrawing, type PolyDrawing } from './polyDrawing'

/** Where the still inside of a turn is drawn from: no piece, no stickers. */
const INSIDE: Cubie = { position: [0, 0, 0], stickers: [] }

/** A gridless puzzle (a star prism, a Pyraminx) drawn from its logical
 *  state; the turning pieces are parented to the animated group, inside the
 *  yaw that sets the puzzle on screen, and what the turn opens stays still
 *  outside it (the Jing's cut sphere). Shared by the scene and the move guide. */
export function PolyModel({ cube, groupRef, isTurning, highlighted = NO_PIECES }: ModelProps) {
  const drawing = polyDrawing(cubeShape(cube))
  const moving = cube.filter((_, i) => isTurning(i))
  const cut = drawing.cut && moving.length > 0 ? drawing.cut(moving) : null
  // Memoized on the (cached) polygons: the mesh is built once per corner.
  const inside = useMemo(
    (): PolyDrawing | null => cut && { ...drawing, polygons: () => cut },
    [drawing, cut],
  )
  return (
    <group rotation={[0, drawing.yaw, 0]}>
      {cube.map((c, i) =>
        isTurning(i) ? null : (
          <PolyPiece key={i} cubie={c} drawing={drawing} highlighted={highlighted(i)} />
        ),
      )}
      {inside && <PolyPiece cubie={INSIDE} drawing={inside} />}
      <group ref={groupRef}>
        {cube.map((c, i) =>
          isTurning(i) ? <PolyPiece key={i} cubie={c} drawing={drawing} /> : null,
        )}
      </group>
    </group>
  )
}
