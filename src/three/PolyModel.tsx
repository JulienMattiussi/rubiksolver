import { cubeShape } from '@/lib/cube'
import type { ModelProps } from './CubeModel'
import { NO_PIECES } from './noPieces'
import { PolyPiece } from './PolyPiece'
import { polyDrawing } from './polyDrawing'

/** A gridless puzzle (a star prism, the Pyraminx) drawn from its logical
 *  state; the turning pieces are parented to the animated group, inside the
 *  yaw that sets the puzzle on screen. Shared by the scene and the move guide. */
export function PolyModel({ cube, groupRef, isTurning, highlighted = NO_PIECES }: ModelProps) {
  const drawing = polyDrawing(cubeShape(cube))
  return (
    <group rotation={[0, drawing.yaw, 0]}>
      {cube.map((c, i) =>
        isTurning(i) ? null : (
          <PolyPiece key={i} cubie={c} drawing={drawing} highlighted={highlighted(i)} />
        ),
      )}
      <group ref={groupRef}>
        {cube.map((c, i) =>
          isTurning(i) ? <PolyPiece key={i} cubie={c} drawing={drawing} /> : null,
        )}
      </group>
    </group>
  )
}
