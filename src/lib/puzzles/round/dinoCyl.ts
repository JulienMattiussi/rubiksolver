import { solvedDino } from '../shared/dinoRex'
import type { Color, Cube, Cubie, Vec3 } from '../../core/types'

/**
 * The Dino Cylinder (fan2cube.fr/dinocylinder1, Li Chung Man, 2011): "comme
 * un Dino mais il a des sommets en plus", cut to a cylinder as high as it is
 * wide. Its corners turn by thirds, as the Dino's, each taking the three
 * edges around it, and its own corner piece, which stays in place and only
 * turns (a third, each turn of it). The cylinder's top and bottom discs are
 * its top and bottom edges' (four quarters each), its side the rest: the
 * corners' small triangles near the rims, the middle edges' "eyes" between
 * them. Turned, its pieces stick out of the cylinder: it shifts shape
 * (three/puzzles/round/dinoCylGeometry.ts).
 *
 * Its model is the Dino Cube's (rainbow.ts), the eight corners added at
 * (1, 1, 1) and the like, each with the colors of its three faces: a turn
 * takes what is at least 2 along its diagonal, its corner (3) with its
 * edges (2), so the Dino's turns turn it as they should.
 */
export function solvedDinoCyl(): Cube {
  const edges = solvedDino()
  // Each face's color, by its normal.
  const color = new Map<string, Color>()
  for (const c of edges) for (const s of c.stickers) color.set(s.normal.join(), s.color)
  const corners = [-1, 1].flatMap((x) =>
    [-1, 1].flatMap((y) =>
      [-1, 1].map((z): Cubie => {
        const normals: Vec3[] = [
          [x, 0, 0],
          [0, y, 0],
          [0, 0, z],
        ]
        return {
          position: [x, y, z],
          stickers: normals.map((normal) => ({ normal, color: color.get(normal.join())! })),
        }
      }),
    ),
  )
  return [...edges, ...corners]
}
