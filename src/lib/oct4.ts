import { layerCoords } from './geometry'
import type { Color, Cube, Cubie, Vec3 } from './types'

/**
 * The 4-Trajber's Octahedron (fan2cube.fr/4-trajber-oct1, Hidetoshi
 * Takeji, 2010): a 4x4x4 cut down to an octahedron, its six corners on the
 * cube's six faces (fan2cube's H, B, G, D, A, P). It turns exactly like a
 * 4x4x4 (outer turns, inner slices, wide turns), so the cube engine runs it
 * as is; only its pieces differ. Every piece shows a single sticker, on the
 * face of the octahedron its octant faces (a diagonal, `TET_NORMALS` and
 * their opposites, which every turn maps onto each other):
 *
 * - the cube's 8 corners: the triangle in the middle of each face
 *   (fan2cube's "centres");
 * - its 24 wings: 3 a face, along its edges (fan2cube's "arêtes");
 * - its 24 face centers: 3 a face, at its corners (fan2cube's "sommets").
 *
 * The cube's edges' middles and core do not exist (a 4x4x4 has none) and its
 * 8 inner cubies are hidden: they are left out. Each face wears one of the
 * eight colors, and opposite faces a pair.
 */

/** The color of each face, by its octant (x, y, z signs): the four faces
 *  above, then the four below, each opposite one above. */
export const OCT_FACE_COLOR: ReadonlyMap<string, Color> = new Map([
  ['1,1,1', 'R'],
  ['-1,1,1', 'G'],
  ['-1,1,-1', 'P'],
  ['1,1,-1', 'W'],
  ['-1,-1,-1', 'O'],
  ['1,-1,-1', 'B'],
  ['1,-1,1', 'V'],
  ['-1,-1,1', 'Y'],
])

/** The solved octahedron: every 4x4x4 cubie but the 8 hidden inner ones. */
export function solvedOct4(): Cube {
  const coords = layerCoords(4)
  const cubies: Cubie[] = []
  for (const x of coords) {
    for (const y of coords) {
      for (const z of coords) {
        const position: Vec3 = [x, y, z]
        if (position.every((v) => Math.abs(v) === 1)) continue // inside
        const normal = position.map(Math.sign) as unknown as Vec3
        cubies.push({ position, stickers: [{ normal, color: OCT_FACE_COLOR.get(normal.join())! }] })
      }
    }
  }
  return cubies
}
