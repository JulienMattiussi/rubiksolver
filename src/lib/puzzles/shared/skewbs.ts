import { DODECA_NORMALS, FACE_NORMAL } from '../../core/geometry'
import type { Color, Cube, Cubie, Face, RainbowCorner, RainbowMove, Vec3 } from '../../core/types'
import { MASTER_SLICES, RAINBOW_CORNERS, RAINBOW_TRIANGLES, SQUARE_COLOR, dot } from './rainbow'
import { DINO_TURNS } from './dinoRex'

/**
 * The Skewbs: the Skewb, the Skewb Ultimate and the Master Skewb, the
 * Rainbow's mechanism (rainbow.ts) cut through the middle, their corners
 * turning half the puzzle (the Master Skewb's, a layer or a slice).
 */

/**
 * The Skewb Ultimate (fan2cube.fr/skewbultimate1, Uwe Mèffert, 1982): a
 * Skewb cut out of a dodecahedron. Each corner of the cube turns by thirds
 * the whole half of the puzzle on its side (the Dino's turn, cut through
 * the center): itself, its three neighbors and the three centers around
 * it. Its 6 centers each show the four faces leaning toward their axis,
 * its 8 corners the three faces meeting at them (the cube's corners are
 * corners of the dodecahedron). Centers on the axes, corners at
 * (1, 1, 1)...; the faces' normals are DODECA_NORMALS, (0, 1, 2) and the
 * like, which the turns permute as they do the real ones.
 */
const SKEWB_COLOR: ReadonlyMap<string, Color> = new Map(
  DODECA_NORMALS.map((n, i): [string, Color] => [
    n.join(),
    (['W', 'G', 'R', 'B', 'O', 'V', 'Y', 'P', 'T', 'L', 'M', 'N'] as const)[i]!,
  ]),
)

export function solvedSkewbU(): Cube {
  const faces = (toward: (n: Vec3) => boolean) =>
    DODECA_NORMALS.filter(toward).map((n) => ({ normal: n, color: SKEWB_COLOR.get(n.join())! }))
  const centers = (Object.keys(FACE_NORMAL) as Face[]).map((f): Cubie => {
    const axis = FACE_NORMAL[f]
    return { position: axis, stickers: faces((n) => dot(n, axis) > 0) }
  })
  const corners = Object.values(RAINBOW_CORNERS).map((d): Cubie => ({
    position: d,
    stickers: faces((n) => n.every((v, a) => v === 0 || Math.sign(v) === d[a])),
  }))
  return [...centers, ...corners]
}

/** Every Skewb Ultimate turn, both ways. */
export const SKEWB_TURNS: readonly RainbowMove[] = DINO_TURNS.map((m) => ({ ...m, skewb: true }))

/** The corners of one set (their coordinates' signs multiplying to 1):
 *  never two opposite, and their turns reach every state. */
const SKEWB_SCRAMBLED: readonly RainbowCorner[] = RAINBOW_TRIANGLES.filter(
  (t) => RAINBOW_CORNERS[t][0] * RAINBOW_CORNERS[t][1] * RAINBOW_CORNERS[t][2] > 0,
)

/** A Skewb Ultimate scramble (and a Skewb's): turns of one set of corners,
 *  never the same twice in a row. A corner then its opposite the other way
 *  would turn the puzzle whole: solved again, as its colors say. */
export function scrambleSkewbU(length: number, rng: () => number): RainbowMove[] {
  const moves: RainbowMove[] = []
  while (moves.length < length) {
    const triangle = SKEWB_SCRAMBLED[Math.floor(rng() * SKEWB_SCRAMBLED.length)]!
    if (triangle === moves[moves.length - 1]?.triangle) continue
    moves.push({ triangle, amount: rng() < 0.5 ? 1 : 2, dino: true, skewb: true })
  }
  return moves
}

/** The Skewb Ultimate turned as a whole: the turns that keep its
 *  dodecahedron, a third about a diagonal and a half about an axis (the
 *  cube's quarter turns would not). */
export const SKEWB_SYMMETRIES: readonly ((cube: Cube) => Cube)[] = [
  ([x, y, z]: Vec3): Vec3 => [y, z, x],
  ([x, y, z]: Vec3): Vec3 => [-x + 0, y, -z + 0],
].map(
  (turn) => (cube: Cube) =>
    cube.map((c) => ({
      ...c,
      position: turn(c.position),
      stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
    })),
)

/**
 * The Skewb (fan2cube.fr/skewb1, Tony Durham, 1982): the Skewb Ultimate's
 * turns on a cube. Each corner turns by thirds the half of the cube on its
 * side: itself, its three neighbors and the three centers around it. Its 6
 * centers show one color, square on their face (a diamond, its corners at
 * the face's edge middles), its 8 corners three, a triangle on each face.
 * Centers on the axes, corners at (1, 1, 1)...: 37 791 360 states, as the
 * page counts.
 */
export function solvedSkewb(): Cube {
  const centers = (Object.keys(FACE_NORMAL) as Face[]).map((f): Cubie => ({
    position: FACE_NORMAL[f],
    stickers: [{ normal: FACE_NORMAL[f], color: SQUARE_COLOR[f] }],
  }))
  const corners = Object.values(RAINBOW_CORNERS).map((d): Cubie => ({
    position: d,
    stickers: (Object.keys(FACE_NORMAL) as Face[])
      .filter((f) => dot(FACE_NORMAL[f], d) > 0)
      .map((f) => ({ normal: FACE_NORMAL[f], color: SQUARE_COLOR[f] })),
  }))
  return [...centers, ...corners]
}

/** The Skewb turned as a whole: a cube's, a third about a diagonal and a
 *  quarter about the vertical (24 holdings). */
export const SKEWB_CUBE_SYMMETRIES: readonly ((cube: Cube) => Cube)[] = [
  ([x, y, z]: Vec3): Vec3 => [y, z, x],
  ([x, y, z]: Vec3): Vec3 => [z, y, -x + 0],
].map(
  (turn) => (cube: Cube) =>
    cube.map((c) => ({
      ...c,
      position: turn(c.position),
      stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
    })),
)

/**
 * The Master Skewb (fan2cube.fr/masterskewb1, Katsuhiko Okamoto, 2003): the
 * Skewb and the Rex Cube in one. Each diagonal is cut twice, either side of
 * the middle: a corner's outer layer (A) takes, as a Skewb's turn, the
 * corner, its three neighbors and the three centers around it, and as a Rex
 * Cube's three edges and nine petals; the inner layer between the two cuts
 * (fan2cube's o = O*O') six edges and six petals. 8 corners, 12 edges (two
 * colors, no way round), 6 centers and 24 petals (one color each).
 *
 * Integer model, a quarter of the cube's half side to the unit: the cuts at
 * 2 along each diagonal, corners at (4, 4, 4), edges at (4, 4, 0), centers
 * at 4 on an axis, petals at (2, 2, 4) (on a face, toward a corner).
 */
export function solvedMasterSkewb(): Cube {
  const out: Cubie[] = []
  const stickersAt = (p: Vec3) =>
    (Object.keys(FACE_NORMAL) as Face[])
      .filter((f) => dot(FACE_NORMAL[f], p) === 4)
      .map((f) => ({ normal: FACE_NORMAL[f], color: SQUARE_COLOR[f] }))
  const signs = [4, 0, -4]
  for (const x of signs) {
    for (const y of signs) {
      for (const z of signs) {
        const p: Vec3 = [x, y, z]
        // Corners, edges and centers: some coordinate at 4.
        if (p.some((v) => v !== 0)) out.push({ position: p, stickers: stickersAt(p) })
      }
    }
  }
  // Petals: on each face, toward each of its corners.
  for (const f of Object.keys(FACE_NORMAL) as Face[]) {
    const n = FACE_NORMAL[f]
    const a = n.findIndex((x) => x !== 0)
    const [u, v] = [0, 1, 2].filter((d) => d !== a) as [number, number]
    for (const s of [2, -2]) {
      for (const t of [2, -2]) {
        const p = [0, 0, 0] as [number, number, number]
        p[a] = 4 * n[a]!
        p[u] = s
        p[v] = t
        out.push({ position: p, stickers: [{ normal: n, color: SQUARE_COLOR[f] }] })
      }
    }
  }
  return out
}

/** A Master Skewb slice as its pad and notation name it: by the bottom
 *  corner of its diagonal (the top one's, the other way round). */
export function canonicalSlice(move: RainbowMove): RainbowMove {
  if (!move.master || !move.slice || RAINBOW_CORNERS[move.triangle][1] < 0) return move
  const opposite = RAINBOW_CORNERS[move.triangle].map((v) => -v).join()
  const triangle = RAINBOW_TRIANGLES.find((t) => RAINBOW_CORNERS[t].join() === opposite)!
  return { ...move, triangle, amount: move.amount === 1 ? 2 : 1 }
}

/** Every Master Skewb turn, both ways: the corners' outer layers, then the
 *  inner slices. */
export const MASTER_TURNS: readonly RainbowMove[] = [
  ...DINO_TURNS.map((m) => ({ ...m, master: true as const })),
  ...MASTER_SLICES.flatMap((triangle) =>
    ([1, 2] as const).map((amount): RainbowMove => ({
      triangle,
      amount,
      dino: true,
      master: true,
      slice: true,
    })),
  ),
]

/** A Master Skewb scramble: its outer layers and slices at random, never
 *  the same diagonal twice in a row. */
export function scrambleMasterSkewb(length: number, rng: () => number): RainbowMove[] {
  const axis = (m: RainbowMove) =>
    RAINBOW_CORNERS[m.triangle].map((v) => v * RAINBOW_CORNERS[m.triangle][1]).join()
  const moves: RainbowMove[] = []
  while (moves.length < length) {
    const move = MASTER_TURNS[Math.floor(rng() * MASTER_TURNS.length)]!
    const last = moves[moves.length - 1]
    if (last && axis(last) === axis(move)) continue
    moves.push(move)
  }
  return moves
}
