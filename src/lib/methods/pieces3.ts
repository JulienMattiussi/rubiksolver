import { FACE_COLOR } from '../cube'
import { cubieAt, hasColors, homeAt } from '../pieces'
import { FACE_NORMAL } from '../geometry'
import { moveSet, type MoveSet } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import { secondLayerDone } from './layers3'
import type { Color, Cube, Cubie, Face, Move, Vec3 } from '../types'

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
export function homeOf(name: string): Vec3 {
  return facesOf(name).reduce<Vec3>(
    (p, f) => [p[0] + FACE_NORMAL[f][0], p[1] + FACE_NORMAL[f][1], p[2] + FACE_NORMAL[f][2]],
    [0, 0, 0],
  )
}

/** Space-separated piece names, e.g. `'DL FL BL DFL DBL'` (the Roux first block). */
export function pieces(names: string): readonly string[] {
  return names.split(/\s+/).filter(Boolean)
}

/** Concatenate piece groups (a block plus the pieces it is extended with). */
export function joined(...groups: ReadonlyArray<readonly string[]>): readonly string[] {
  return groups.flat()
}

/** The four last-layer corners, and the twelve edges. */
export const U_CORNERS = pieces('UFL UFR UBL UBR')
const ALL_EDGES = pieces('UF UB UL UR DF DB DL DR FL FR BL BR')

/** Whether every named piece is home (whole cube or tracked pieces). */
export function piecesHome(cubies: readonly Cubie[], names: readonly string[]): boolean {
  return homeAt(cubies, names.map(homeOf), '3')
}

/** The piece belonging at `name` sits there, however it is twisted. */
export function pieceInSlot(cubies: readonly Cubie[], name: string): boolean {
  const cubie = cubieAt(cubies, homeOf(name))
  return (
    cubie !== undefined &&
    hasColors(
      cubie,
      facesOf(name).map((f) => FACE_COLOR[f]),
    )
  )
}

/**
 * Phase building the named pieces with `moves` only (blockbuilding): the
 * search tracks just these pieces, so pieces solved earlier must be listed
 * again when the moves could disturb them.
 */
export function buildBlock(names: readonly string[], moves: MoveSet): (cube: Cube) => Move[] {
  const track = names.map(homeOf)
  return (cube) => solvePieces(cube, { track, moves, maxDepth: 20 })
}

/** First two layers solved and every edge oriented (Petrus, ZZ). */
export function orientedF2LDone(cube: Cube): boolean {
  return secondLayerDone(cube) && edgesOriented(cube)
}

/** The F2L finished with <R, U> only, pair by pair (Petrus step 4, the ZZ
 *  right block): possible once every edge is oriented. */
export const RU = moveSet('R U')
export const RU_F2L_PHASES = [
  buildBlock(pieces('DR FR DFR'), RU),
  buildBlock(pieces('DR FR DFR BR DBR'), RU),
]

const UD_COLORS: readonly Color[] = [FACE_COLOR.U, FACE_COLOR.D]
const FB_COLORS: readonly Color[] = [FACE_COLOR.F, FACE_COLOR.B]

const isEdge = (c: Cubie): boolean => c.stickers.length === 2

/**
 * Edge orientation on the F/B axis, the one ZZ and Petrus build on (and the
 * 4x4 OLL parity detector, see solver4/parity.ts): an edge
 * is "good" when it can be solved without quarter turns of F or B. Its
 * reference sticker (U/D color, else F/B color) must lie on its slot's
 * reference side (U/D in the top and bottom layers, F/B in the middle one).
 * U, D, L, R, F2, B2 and M2 keep every edge good; F, B (and M) quarter turns
 * flip the edges they move.
 */
export function edgeOriented(edge: Cubie): boolean {
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

/**
 * Phase orienting all twelve edges with `moves` (and `macros`), searched on
 * the orientation pattern alone. Only for move sets that keep the rest of
 * the step's work, since nothing else is tracked.
 */
export function orientAllEdges(moves: MoveSet, macros?: readonly (readonly Move[])[]) {
  return (cube: Cube): Move[] =>
    solvePieces(cube, {
      track: ALL_EDGES.map(homeOf),
      moves,
      macros,
      goal: edgesOriented,
      key: orientationKey,
      maxDepth: 10,
    })
}
