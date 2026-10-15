import { FACE_NORMAL, mapVec } from '../../core/geometry'
import type { Cube, Cubie, Face, RainbowMove, Vec3 } from '../../core/types'
import { RAINBOW_TURNS, SQUARE_COLOR, scrambleRainbow, solvedRainbow } from './rainbow'

/**
 * The Dino Cube and the Rex Cube: the Rainbow's mechanism (rainbow.ts) cut
 * out of a cube, their corners turning by thirds.
 */

/**
 * The Dino Cube (fan2cube.fr/dinocube1, Robert Webb and Stephen Harvey,
 * 1995): the Rainbow's mechanism, cut out of a cube. Its corners turn by
 * thirds, each taking the three edge pieces around it; its 12 pieces are
 * those edges, two triangles each (one on each of its faces, cut along the
 * faces' diagonals), and nothing else: no fixed center. 12!/2 states.
 */
export function solvedDino(): Cube {
  return solvedRainbow()
    .filter((c) => c.position.includes(0))
    .map((c) => ({ ...c, stickers: c.stickers.filter((s) => s.normal.includes(0)) }))
}

/** Every Dino turn, both ways. */
export const DINO_TURNS: readonly RainbowMove[] = RAINBOW_TURNS.map((m) => ({ ...m, dino: true }))

/** A Dino scramble: the Rainbow's, in the Dino's turns. */
export const scrambleDino = (length: number, rng: () => number): RainbowMove[] =>
  scrambleRainbow(length, rng).map((m) => ({ ...m, dino: true }))

/**
 * The Rex Cube (fan2cube.fr/rexcube1, Andrew Cormier, 2010): the Dino's
 * turns, cut deeper (curved cuts meeting at the corners, so no corner
 * pieces): a corner's third of a turn takes its three edges, the three
 * centers around it and nine petals. In integer units of a quarter of the
 * cube's half side: centers at 4 on an axis, edges at (3, 3, 0), petals at
 * (2, 4, 2) (on a face, toward a corner); a corner turns what is at least 4
 * along its diagonal: its three petals (8), the six around them (4), its
 * three edges (6), its three centers (4). 11!/2 x 6!/2 x 24!/4!^6 states,
 * as the page counts.
 */
export function solvedRex(): Cube {
  const out: Cubie[] = []
  const colorOf = (normal: Vec3) =>
    SQUARE_COLOR[
      (Object.keys(FACE_NORMAL) as Face[]).find((f) => FACE_NORMAL[f].join() === normal.join())!
    ]
  const axes = (Object.keys(FACE_NORMAL) as Face[]).map((f) => FACE_NORMAL[f])
  // Centers.
  for (const n of axes) {
    out.push({
      position: mapVec(n, (x) => 4 * x),
      stickers: [{ normal: n, color: colorOf(n) }],
    })
  }
  // Edges: two coordinates +-3.
  for (const piece of solvedDino()) {
    out.push({ ...piece, position: mapVec(piece.position, (x) => 3 * x) })
  }
  // Petals: on each face, toward each of its corners.
  for (const n of axes) {
    const a = n.findIndex((x) => x !== 0)
    for (const s of [1, -1]) {
      for (const t of [1, -1]) {
        const [u, v] = [0, 1, 2].filter((d) => d !== a)
        const position = [0, 0, 0] as [number, number, number]
        position[a] = 4 * n[a]!
        position[u!] = 2 * s
        position[v!] = 2 * t
        out.push({ position, stickers: [{ normal: n, color: colorOf(n) }] })
      }
    }
  }
  return out
}

/** Every Rex turn, both ways. */
export const REX_TURNS: readonly RainbowMove[] = DINO_TURNS.map((m) => ({ ...m, rex: true }))

/** A Rex scramble: the Dino's, in the Rex's turns. */
export const scrambleRex = (length: number, rng: () => number): RainbowMove[] =>
  scrambleRainbow(length, rng).map((m) => ({ ...m, dino: true, rex: true }))
