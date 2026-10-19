import { faceColorsOf } from '@/lib/core/cube'
import { hasColoredClips, type CubeShape } from '@/lib/core/shapes'
import { gearAt } from '@/lib/puzzles/gear/gear'
import OUTLINES from '@/assets/gear/outlines.json'
import {
  faceCorners,
  finish,
  toSvg,
  VISIBLE,
  type IsoDrawing,
  type IsoFace,
  type Point,
} from '@/three/core/isoKit'

/** A drawing's quarter turn about its center (face units, 0 to 300). */
const quarter = ([x, y]: readonly number[]): [number, number] => [300 - y!, x!]

/** The Gear Cube: each visible face as agreed (gearFace.ts's shapes, from
 *  outlines.json), every piece turned to its four places, on the black. */
export function gearThumbnail(shape: CubeShape): IsoDrawing {
  const faces: IsoFace[] = VISIBLE.map(({ axis, shade }) => {
    const face = (['R', 'U', 'F'] as const)[axis]
    const [u, v] = [(axis + 1) % 3, (axis + 2) % 3]
    const at = ([x, y]: readonly number[]): Point => {
      const p = [0, 0, 0]
      p[axis] = 1.5
      p[u] = x! / 100 - 1.5
      p[v] = y! / 100 - 1.5
      return p as unknown as Point
    }
    const square = faceCorners([-1.5, -1.5, -1.5], [1.5, 1.5, 1.5], axis as 0 | 1 | 2)
    // Plain clips (the plain Gear Cube) bear no color: left black.
    const kinds = Object.entries(OUTLINES).filter(
      ([kind]) => kind !== 'clip' || hasColoredClips(shape),
    )
    // The Extreme's middle-layer edges are blocks, no gears nor clips; a
    // block is drawn nowhere else.
    const middle = (k: number) => {
      let cell: readonly number[] = [150, 50]
      for (let i = 0; i < k; i++) cell = quarter(cell)
      return axis !== 1 && Math.abs(at(cell)[1]) < 0.5
    }
    const blocks = !gearAt(shape, [1, 0, 1])
    const drawn = (kind: string, k: number) =>
      kind === 'block'
        ? blocks && middle(k)
        : !(blocks && (kind === 'gear' || kind === 'clip') && middle(k))
    const pieces = kinds.flatMap(([kind, polygons]) =>
      (kind === 'center' ? [0] : [0, 1, 2, 3])
        .filter((k) => drawn(kind, k))
        .flatMap((k) =>
          (polygons as number[][][]).map((poly) =>
            poly.map((point) => {
              let p = point as readonly number[]
              for (let i = 0; i < k; i++) p = quarter(p)
              return at(p)
            }),
          ),
        ),
    )
    return {
      depth: 0,
      polygons: [
        { points: toSvg(square), paint: 'body' as const, shade },
        ...pieces.map((poly) => ({
          points: toSvg(poly),
          paint: faceColorsOf(shape)[face],
          shade,
        })),
      ],
    }
  })
  return finish(faces)
}
