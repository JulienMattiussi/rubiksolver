import { useMemo } from 'react'
import { cubeShape } from '@/lib/core/cube'
import type { Cubie } from '@/lib/core/types'
import type { ModelProps } from './CubeModel'
import { NO_PIECES } from './noPieces'
import { Decal } from './Decal'
import { PolyPiece } from './PolyPiece'
import { polyDrawing, type PolyDrawing } from './polyDrawing'

/** No turn of the frame (a puzzle whose polygons are already in the scene's). */
const IDENTITY = [0, 0, 0, 1] as const
const ORIGIN = [0, 0, 0] as const

/** Where the still inside of a turn is drawn from: no piece, no stickers. */
const INSIDE: Cubie = { position: [0, 0, 0], stickers: [] }

/** A puzzle drawn from polygons (a star prism, a Pyraminx, the
 *  Pyramorphinx) from its logical state; the turning pieces are parented to
 *  the animated group, inside the yaw that sets the puzzle on screen (and
 *  the frame its turns are in, `orient`), and what the turn opens stays
 *  still outside it (the Jing's cut sphere). Shared by the scene and the
 *  move guide. */
export function PolyModel({
  cube,
  groupRef,
  isTurning,
  highlighted = NO_PIECES,
  hatched = NO_PIECES,
  marked = NO_PIECES,
  pulse = false,
  onPick,
  children,
}: ModelProps) {
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
      <group quaternion={drawing.orient ?? IDENTITY} position={drawing.offset ?? ORIGIN}>
        {cube.map((c, i) =>
          isTurning(i) ? null : (
            <PolyPiece
              key={i}
              cubie={c}
              drawing={drawing}
              highlighted={highlighted(i)}
              hatched={hatched(i)}
              marked={marked(i)}
              pulse={pulse}
              onPick={onPick && (() => onPick(i))}
            />
          ),
        )}
        {cube.map((c, i) =>
          drawing.decal?.on(i, c) && !isTurning(i) ? (
            <Decal key={i} cubie={c} decal={drawing.decal} />
          ) : null,
        )}
        {inside && <PolyPiece cubie={INSIDE} drawing={inside} />}
        {children}
        <group ref={groupRef}>
          {cube.map((c, i) =>
            isTurning(i) ? (
              <PolyPiece
                key={i}
                cubie={c}
                drawing={drawing}
                highlighted={highlighted(i)}
                hatched={hatched(i)}
              />
            ) : null,
          )}
          {cube.map((c, i) =>
            drawing.decal?.on(i, c) && isTurning(i) ? (
              <Decal key={i} cubie={c} decal={drawing.decal} />
            ) : null,
          )}
        </group>
      </group>
    </group>
  )
}
