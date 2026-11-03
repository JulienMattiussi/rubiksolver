import { FACE_COLOR } from '../../core/cube'
import { normalIndex, SECTOR_NORMALS } from '../../core/geometry'
import type {
  Cube,
  Cubie,
  Face,
  SectorMove,
  SectorSteps,
  Sticker,
  Turn,
  Vec3,
} from '../../core/types'
import { applySectorMove, sectorAt, sectorFaced, sectorPlace } from '../shared/sectors'

/**
 * The Square-1: a cube cut in three layers, its top and bottom ones turning
 * by twelfths, its middle one cut in two halves, the right one flipping
 * over with the slash. Its mechanism is the Hockey Puck's
 * (shared/sectors.ts); its pieces are 8 edges, a twelfth each, and 8
 * corners, two twelfths each, so that its shape changes as they move, and
 * the slash only goes when no corner lies across its cut. Held with its
 * cut along the model's y axis, its sides face the directions of sectors
 * 2, 5, 8 and 11 when it is a cube (or 0, 3, 6 and 9, held upside down).
 *
 * A piece's stickers: its top or bottom face first (normal along z), then
 * its sides, each facing a sector's direction. An edge's side faces its own
 * sector; a corner on boundary j (sectors j - 1 and j) faces sectors j - 2
 * and j + 1. The middle halves sit off the layers, at x = 1 and x = -1,
 * their three sides facing as the layers' do.
 */

/** The side a direction faces when solved, held the usual way up. */
const SIDE_OF: Record<number, Face> = { 2: 'R', 5: 'F', 8: 'L', 11: 'B' }

const side = (m: number): Sticker => ({
  normal: SECTOR_NORMALS[m]!,
  color: FACE_COLOR[SIDE_OF[m]!],
})

/** The solved Square-1: on each layer the edges on sectors 2, 5, 8, 11 and
 *  the corners on boundaries 1, 4, 7, 10, then the middle halves. */
export function solvedSquare1(): Cube {
  const cap = (z: number): Sticker => ({
    normal: [0, 0, z],
    color: FACE_COLOR[z > 0 ? 'U' : 'D'],
  })
  const layer = (z: number): Cubie[] => [
    ...[2, 5, 8, 11].map((m): Cubie => ({ position: sectorAt(m, z), stickers: [cap(z), side(m)] })),
    ...[1, 4, 7, 10].map((j): Cubie => ({
      position: sectorAt(j, z, true),
      stickers: [cap(z), side((j + 10) % 12), side((j + 1) % 12)],
    })),
  ]
  return [
    ...layer(1),
    ...layer(-1),
    { position: [1, 0, 0], stickers: [2, 11, 5].map(side) },
    { position: [-1, 0, 0], stickers: [8, 11, 5].map(side) },
  ]
}

/** Whether the slash can go: no corner across its cut (on boundary 0 or
 *  6) in either layer. Its layers always turn. */
export function square1Turns(cube: Cube, move: Turn): boolean {
  if (!('flip' in move)) return true
  return cube.every((c) => {
    const place = sectorPlace(c.position)
    return !place?.wide || place.m % 6 !== 0
  })
}

/** Whether it is solved, however it is held: each direction one color, a
 *  cube (every side facing one of the cube's four ways, the middle's too). */
export function square1Solved(cube: Cube): boolean {
  const colors = new Map<number, string>()
  let ways: number | undefined
  for (const c of cube) {
    for (const s of c.stickers) {
      const m = sectorFaced(s.normal)
      if (m !== undefined) {
        if (ways === undefined) ways = m % 3
        else if (m % 3 !== ways) return false
      }
      const key = normalIndex(s.normal)
      const seen = colors.get(key)
      if (seen === undefined) colors.set(key, s.color)
      else if (seen !== s.color) return false
    }
  }
  return true
}

/** The whole puzzle turned about its cut's line or about its axis: the
 *  ways to hold it that keep its cut where the slash turns. */
const turnWhole =
  (map: (v: Vec3) => Vec3) =>
  (cube: Cube): Cube =>
    cube.map((c) => ({
      ...c,
      position: map(c.position),
      stickers: c.stickers.map((s) => ({ normal: map(s.normal), color: s.color })),
    }))

export const SQUARE1_SYMMETRIES = [
  turnWhole(([x, y, z]) => [x, -y, -z]),
  turnWhole(([x, y, z]) => [-x, -y, z]),
]

/** The layer turns, then the slash when it can go: a Square-1's scramble,
 *  `length` turns long. */
export function scrambleSquare1(length: number, rng: () => number, start: Cube): SectorMove[] {
  const moves: SectorMove[] = []
  let state = start
  const play = (move: SectorMove) => {
    moves.push(move)
    state = applySectorMove(state, move)
  }
  while (moves.length < length) {
    // The layer turns after which the slash can go, one drawn among them.
    const ways: [number, number][] = []
    for (let u = 0; u < 12; u++) {
      for (let d = 0; d < 12; d++) {
        if (u === 0 && d === 0) continue
        let next = state
        if (u) next = applySectorMove(next, { layer: 'U', steps: u as SectorSteps })
        if (d) next = applySectorMove(next, { layer: 'D', steps: d as SectorSteps })
        if (square1Turns(next, { flip: true })) ways.push([u, d])
      }
    }
    const [u, d] = ways[Math.floor(rng() * ways.length)]!
    if (u) play({ layer: 'U', steps: u as SectorSteps })
    if (d) play({ layer: 'D', steps: d as SectorSteps })
    play({ flip: true })
  }
  return moves.slice(0, length)
}
