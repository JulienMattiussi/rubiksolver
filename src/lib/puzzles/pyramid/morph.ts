import { TET_NORMALS } from '../../core/geometry'
import { PYRA_CORNERS, PYRA_FACE_COLOR, PYRA_VERTICES } from './pyraminx'
import type { Cube, Cubie, Vec3 } from '../../core/types'

/**
 * The Pyramorphinx (fan2cube.fr/pyramorphinx1): a 2x2 cut down to the
 * tetrahedron inscribed in it, so it turns exactly like a Pocket (2x2
 * moves, 2x2 positions) while its pieces differ in shape: the 4 cubies at
 * the tetrahedron's corners keep a corner of it (three stickers), the 4
 * others keep the middle of a face (one sticker). Turned, a big piece lands
 * where a small one belongs and the puzzle takes its strange forms.
 *
 * Its corners are the Pyraminx's (alternate corners of the cube, see
 * pyraminx.ts) and its faces wear the same colors; a sticker faces the way
 * its face does (`TET_NORMALS`), and the engine turns those normals like any
 * other. A cubie at a corner of the cube where the tetrahedron has none
 * (the opposite of a corner direction) holds the center of the face facing
 * that way.
 */

/** The solved Pyramorphinx, listed like a 2x2 (x, then y, then z). */
export function solvedMorph(): Cube {
  const cubies: Cubie[] = []
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        const position: Vec3 = [x, y, z]
        const corner = PYRA_VERTICES.find((v) => PYRA_CORNERS[v].join() === position.join())
        const stickers = PYRA_VERTICES.flatMap((v, i) => {
          const normal = TET_NORMALS[i]!
          // A corner lies on the three faces not opposite it; a face's
          // center is the cubie its outward normal points to.
          const shows = corner ? v !== corner : normal.join() === position.join()
          return shows ? [{ normal, color: PYRA_FACE_COLOR[v] }] : []
        })
        cubies.push({ position, stickers })
      }
    }
  }
  return cubies
}
