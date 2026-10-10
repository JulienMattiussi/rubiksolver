import { FACE_COLOR, FACE_NORMAL } from '../cube'
import type { MoveSet } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import { colorAt } from '../solverKit'
import type { Cube, Cubie, Face, Move, Vec3 } from '../types'

/**
 * 3x3 pieces named the way cubers name them: by the faces they sit on, so
 * `DFL` is the down-front-left corner, `UR` an edge, `L` the left center.
 * The frame is absolute (FACE_COLOR): a 3x3's outer turns never move its
 * centers, and the L/R centers stay put even under M and r, so a block's
 * colors are known before it is built.
 */

const FACES = new Set<string>(Object.keys(FACE_NORMAL))

function facesOf(name: string): Face[] {
  const faces = [...name]
  if (!faces.every((f) => FACES.has(f))) throw new Error(`Unknown piece "${name}"`)
  return faces as Face[]
}

/** Home position of a named piece. */
export function home(name: string): Vec3 {
  return facesOf(name).reduce<Vec3>(
    (p, f) => [p[0] + FACE_NORMAL[f][0], p[1] + FACE_NORMAL[f][1], p[2] + FACE_NORMAL[f][2]],
    [0, 0, 0],
  )
}

/** Space-separated piece names, e.g. `'L DL FL BL DFL DBL'` (the Roux first block). */
export function pieces(names: string): readonly string[] {
  return names.split(/\s+/).filter(Boolean)
}

/** Concatenate piece groups (a block plus the pieces it is extended with). */
export function joined(...groups: ReadonlyArray<readonly string[]>): readonly string[] {
  return groups.flat()
}

/**
 * Whether every named piece is home and turned the right way: the cubie at
 * its home position shows each of the piece's faces in that face's color.
 * Works on a whole cube or on the few cubies a piece search tracks.
 */
export function piecesHome(cubies: readonly Cubie[], names: readonly string[]): boolean {
  return names.every((name) => {
    const [x, y, z] = home(name)
    const cubie = cubies.find(
      (c) => c.position[0] === x && c.position[1] === y && c.position[2] === z,
    )
    return cubie !== undefined && facesOf(name).every((f) => colorAt(cubie, f) === FACE_COLOR[f])
  })
}

/** The piece belonging at `name` sits there, however it is twisted. */
export function pieceInSlot(cubies: readonly Cubie[], name: string): boolean {
  const [x, y, z] = home(name)
  const cubie = cubies.find(
    (c) => c.position[0] === x && c.position[1] === y && c.position[2] === z,
  )
  const want = facesOf(name).map((f) => FACE_COLOR[f])
  return (
    cubie !== undefined &&
    cubie.stickers.length === want.length &&
    cubie.stickers.every((s) => want.includes(s.color))
  )
}

/**
 * Phase building the named pieces with `moves` only (blockbuilding): the
 * search tracks just these pieces, so pieces solved earlier must be listed
 * again when the moves could disturb them.
 */
export function buildBlock(
  names: readonly string[],
  moves: MoveSet,
  maxDepth = 20,
): (cube: Cube) => Move[] {
  const track = names.map(home)
  return (cube) => solvePieces(cube, { track, moves, maxDepth })
}

const UD_COLORS = [FACE_COLOR.U, FACE_COLOR.D]
const FB_COLORS = [FACE_COLOR.F, FACE_COLOR.B]

const isEdge = (c: Cubie): boolean => c.stickers.length === 2

/**
 * Edge orientation on the F/B axis, the one ZZ and Petrus build on: an edge
 * is "good" when it can be solved without quarter turns of F or B. Its
 * reference sticker (U/D color, else F/B color) must lie on its slot's
 * reference side (U/D in the top and bottom layers, F/B in the middle one).
 * U, D, L, R, F2, B2 and M2 keep every edge good; F, B (and M) quarter turns
 * flip the edges they move.
 */
function edgeOriented(edge: Cubie): boolean {
  const ref =
    edge.stickers.find((s) => UD_COLORS.includes(s.color)) ??
    edge.stickers.find((s) => FB_COLORS.includes(s.color))
  if (!ref) throw new Error('edgeOriented: not an edge')
  const axis = edge.position[1] !== 0 ? 1 : 2
  return ref.normal[axis] !== 0
}

/** Every edge among `cubies` is good (whole cube or tracked pieces). */
export function edgesOriented(cubies: readonly Cubie[]): boolean {
  return cubies.filter(isEdge).every(edgeOriented)
}

/**
 * Dedup key for orientation-only goals: which slots hold a good edge. Under
 * any turn, the next pattern depends only on this one (identities do not
 * matter), so a search keyed on it explores 2^11 states instead of billions.
 */
export function orientationKey(cubies: readonly Cubie[]): string {
  return cubies
    .filter(isEdge)
    .map((e) => `${e.position.join(',')}${edgeOriented(e) ? '+' : '-'}`)
    .sort()
    .join(' ')
}
