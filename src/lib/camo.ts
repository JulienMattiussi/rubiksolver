import { AXIS_ROTATIONS, layerCoords } from './geometry'
import type { Cube, Cubie, Vec3 } from './types'

/**
 * The Camouflage 4x4x2 (WitEden, 2012): a 4x4x4 whose middle two layers of
 * height are gone and whose pieces are each glued across two layers. Seen
 * from above it is a 4x4, its outer rows thick and its inner ones thin (a
 * Domino 3x3x2 whose middle layer is cut in two); it is two pieces tall,
 * each piece one unit high but spanning a thin and a thick layer of the
 * 4x4x4 inside.
 *
 * The model keeps a 4x4x4 mechanism (`turnDims`): each piece stands for
 * its cell in the middle layers (x, z in {-3, -1, 1, 3}, y in {-1, 1}),
 * and turns as that cell does. What it looks like and what it blocks is
 * its box, in scene units: thick layers 1 wide, thin ones 0.5, every piece
 * 1 high, then turned with the piece (`camoBox`). A turn goes when no
 * piece's box straddles one of its cuts (`camoTurns`): in its box, the top
 * or bottom turns as a whole only (fan2cube's H*), never its outer layer
 * alone; a side's layers turn as they like, and send pieces out of the box.
 */

/** A box: per axis, its low and high bound. */
export type Box = readonly (readonly [number, number])[]

/** Where a cell lies on an axis, in scene units: thick outer layers, thin
 *  inner ones; one unit high on the puzzle's height (`tall`). */
function extent(v: number, tall: boolean): [number, number] {
  const [a, b] = tall ? [0, 1] : Math.abs(v) === 3 ? [0.5, 1.5] : [0, 0.5]
  return v > 0 ? [a, b] : [-b, -a]
}

/** A piece's box in its solved place. */
const homeBox = (p: Vec3): Box => p.map((v, a) => extent(v, a === 1))

/** The solved puzzle's slots: their place and their stickers' normals. */
const SLOTS = (() => {
  const slots: { position: Vec3; normals: string[] }[] = []
  for (const x of layerCoords(4)) {
    for (const y of layerCoords(2)) {
      for (const z of layerCoords(4)) {
        const position: Vec3 = [x, y, z]
        const normals = [0, 1, 2]
          .filter((a) => Math.abs(position[a]!) === (a === 1 ? 1 : 3))
          .map((a) => [0, 1, 2].map((d) => (d === a ? Math.sign(position[a]!) : 0)).join())
        slots.push({ position, normals })
      }
    }
  }
  return slots
})()

/** A piece's box as it stands: its solved box turned as the piece is (the
 *  whole-puzzle turn taking a solved slot of its kind to where it stands,
 *  its stickers onto theirs; any such slot gives the same box). */
const BOXES = new Map<string, Box>()

export function camoBox(cubie: Cubie): Box {
  const normals = cubie.stickers.map((s) => s.normal.join()).sort()
  const at = cubie.position.join()
  const id = `${at}|${normals.join('|')}`
  const known = BOXES.get(id)
  if (known) return known
  const box = boxOf(at, normals)
  BOXES.set(id, box)
  return box
}

function boxOf(at: string, normals: readonly string[]): Box {
  for (const slot of SLOTS) {
    if (slot.normals.length !== normals.length) continue
    for (const turn of AXIS_ROTATIONS) {
      if (turn(slot.position).join() !== at) continue
      const turned = slot.normals.map((n) =>
        turn(n.split(',').map(Number) as unknown as Vec3).join(),
      )
      if (turned.sort().join('|') !== normals.join('|')) continue
      const box = homeBox(slot.position)
      const [lo, hi] = [0, 1].map((k) => turn(box.map((b) => b[k]!) as unknown as Vec3))
      return [0, 1, 2].map((a) => [Math.min(lo![a]!, hi![a]!), Math.max(lo![a]!, hi![a]!)] as const)
    }
  }
  throw new Error('camoBox: no solved slot leads here')
}

/** Whether every piece is back in the box, as its slot's own piece is. */
export function camoBoxed(cube: Cube): boolean {
  return cube.every((c) => {
    if (Math.abs(c.position[1]) !== 1) return false
    const box = camoBox(c)
    const home = homeBox(c.position)
    return box.every(([lo, hi], a) => lo === home[a]![0] && hi === home[a]![1])
  })
}

/** Where a cut of the mechanism lies in the scene: between the thin and
 *  thick layers, or in the middle. */
const sceneCut = (cut: number) => (Number.isFinite(cut) ? cut / 4 : cut)

/** Whether a turn of the slab between these cuts on this axis (the
 *  mechanism's, see moveSlab) can go: no piece straddles either cut. */
export function camoTurns(cube: Cube, axis: number, slab: { lo: number; hi: number }): boolean {
  const cuts = [slab.lo, slab.hi].filter(Number.isFinite).map(sceneCut)
  return cube.every((c) => {
    const [lo, hi] = camoBox(c)[axis]!
    return cuts.every((cut) => !(lo < cut - 1e-9 && hi > cut + 1e-9))
  })
}

/** The axis a piece is one unit high on (its box's side that reaches the
 *  middle and is 1 long): the one where it straddles a cut. */
export function tallAxis(cubie: Cubie): number {
  const box = camoBox(cubie)
  return [0, 1, 2].find((a) => {
    const [lo, hi] = box[a]!
    return hi - lo === 1 && (lo === 0 || hi === 0)
  })!
}
