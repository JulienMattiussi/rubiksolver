import { thicknessOf } from '../../core/shape'
import type { CubeShape } from '../../core/shapes'
import type { CubeColor } from '../../core/types'
import { cubeToEdit } from '../edit'
import type { ScanReading } from './classify'
import { orderFor } from './plan'
import { cheapest, measuresOf, type Held, type Sizes } from './sizedRead'

/**
 * A 2x2 mirror read from what its stickers measure (pure, sized.ts): no
 * center gives a face its scale (each picture is taken nearer or farther),
 * but its layers have two sizes only, far apart (3 and 2 cm on the Qiyi):
 * on each face, a side is thick or thin by how it compares to the others.
 * A face whose sides all measure alike is read both ways. Then each piece
 * goes where it fits the sides best (sizedRead.ts, the Hungarian method),
 * the faces held as the scan's gestures say, from any first face (the
 * reading is the cube as it is held), the camera facing the user or not:
 * the cheapest reading wins.
 */

/** Between the thin and the thick: the share their sizes differ by, past
 *  which a face's sides are told apart (1.5 on the Qiyi, minus the black
 *  frames and the slant of a picture). */
const APART = 1.25

/** The faces as the scan's gestures bring them, a phone's camera, or one
 *  facing the user. */
const WAYS: readonly Held[] = [false, true].map((behind) =>
  orderFor(behind).map(({ front, up }) => [front, up] as const),
)

/** A face's sides told thin or thick (as the thicknesses `thin`, `thick`):
 *  one way, or both when they all measure alike. */
function told(
  sizes: ReadonlyMap<string, readonly [number, number]>,
  thin: number,
  thick: number,
): Sizes[] {
  const all = [...sizes.values()].flat()
  const [low, high] = [Math.min(...all), Math.max(...all)]
  const as = (pick: (v: number) => number): Sizes =>
    new Map([...sizes].map(([key, [w, h]]) => [key, [pick(w), pick(h)] as const]))
  if (high / low >= APART) {
    const middle = Math.sqrt(low * high)
    return [as((v) => (v < middle ? thin : thick))]
  }
  return [as(() => thin), as(() => thick)]
}

/** Every way to read the faces: one per face's way, all combined. */
export const combined = <T>(ways: readonly (readonly T[])[]): T[][] =>
  ways.reduce<T[][]>((all, face) => all.flatMap((so) => face.map((f) => [...so, f])), [[]])

/** A 2x2 mirror read from its faces' sides (pixels), held as the scan's
 *  gestures say: the cheapest reading, else the face with the fewest
 *  stickers found, to take again. */
export function readCross(
  faces: readonly ReadonlyMap<string, readonly [number, number]>[],
  shape: CubeShape,
  ways: readonly Held[] = WAYS,
): ScanReading {
  const fewest = faces.reduce((worst, s, f) => (s.size < faces[worst]!.size ? f : worst), 0)
  if (faces[fewest]!.size < 4) return { ok: false, face: fewest }
  const thickness = thicknessOf(shape, 'mirror')
  const sizes = Object.values(thickness).filter((t) => t !== 1)
  const [thin, thick] = [Math.min(...sizes), Math.max(...sizes)]
  const readings = combined(faces.map((f) => told(f, thin, thick))).flatMap((read) =>
    ways.map((held) =>
      cheapest(
        shape,
        measuresOf(read, held, (v) => v),
        (c) => thickness[c as CubeColor],
      ),
    ),
  )
  const best = readings.reduce((a, b) => (b.cost < a.cost ? b : a))
  return { ok: true, edit: cubeToEdit(best.state) }
}
