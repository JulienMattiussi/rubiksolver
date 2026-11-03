import { normalIndex, SECTOR_NORMALS } from '../../core/geometry'
import type { FaceLabels } from '../../core/notation'
import type { Cube, SectorMove, SectorSteps, Sticker, Vec3 } from '../../core/types'

/**
 * Two layers of twelve sectors turning on each other, a twelfth (30
 * degrees) at a time, and the slash, flipping the right half over about
 * the line across its cut: the Hockey Puck's mechanism (round/puck.ts), and
 * the Square-1's (twisted/square1.ts), whose corners fill two sectors.
 *
 * The model stays integer. Sector m (0 to 11) is clockwise from the top
 * line, its middle at 75 - 30m degrees, in the plane x, y (its direction,
 * `SECTOR_NORMALS`); the top layer at z = 1, the bottom one at z = -1. A
 * piece filling two sectors sits on the line between them: boundary j
 * lies between sectors j - 1 and j, at 90 - 30j degrees. A layer's turn of
 * k sectors, clockwise seen from its own side as a cube's face turns (the
 * top's from above, the bottom's from below, as fan2cube writes them),
 * takes m to m + k on top, m - k below (j alike), and the sides facing a
 * sector's direction along. The slash turns the right
 * half (x > 0) about the x axis, (x, y, z) to (x, -y, -z): sector m (0 to
 * 5) of either layer to sector 5 - m of the other, boundary j (1 to 5) to
 * 6 - j; boundaries 0 and 6 lie on its cut, a piece there blocks it.
 * Positions are integer points near each direction, only ever told apart.
 */

const BOUNDARIES: readonly (readonly [number, number])[] = [
  [0, 8],
  [4, 7],
  [7, 4],
  [8, 0],
  [7, -4],
  [4, -7],
  [0, -8],
  [-4, -7],
  [-7, -4],
  [-8, 0],
  [-7, 4],
  [-4, 7],
]

/** Where a piece sits: its sector (or boundary, `wide`) and its layer. */
interface SectorPlace {
  readonly m: number
  readonly z: number
  /** On a boundary, filling the two sectors around it. */
  readonly wide: boolean
}

const PLACE_OF = new Map<string, SectorPlace>(
  [false, true].flatMap((wide) =>
    (wide ? BOUNDARIES : SECTOR_NORMALS).flatMap(([x, y], m) =>
      [1, -1].map((z) => [[x, y, z].join(), { m, z, wide }] as const),
    ),
  ),
)

/** The place of a position on the layers, if a piece's. */
export const sectorPlace = (position: Vec3): SectorPlace | undefined =>
  PLACE_OF.get(position.join())

/** The position of sector m of a layer (z: 1 on top, -1 below), or of
 *  boundary m (`wide`). */
export const sectorAt = (m: number, z: number, wide = false): Vec3 => {
  const [x, y] = (wide ? BOUNDARIES : SECTOR_NORMALS)[m]!
  return [x, y, z]
}

const mod = (a: number, n: number) => ((a % n) + n) % n

/** The sector a side faces (its normal one of `SECTOR_NORMALS`), if any. */
export const sectorFaced = (normal: Vec3): number | undefined => {
  const index = normal[2] === 0 ? normalIndex(normal) - 48 : -1
  return index >= 0 && index < 12 ? index : undefined
}

/** A sticker turned with its layer: a side facing a sector faces the one
 *  k further. */
const turned = (s: Sticker, k: number): Sticker => {
  const m = sectorFaced(s.normal)
  return m === undefined ? s : { normal: SECTOR_NORMALS[mod(m + k, 12)]!, color: s.color }
}

/** A sticker turned by the slash, about the x axis. */
const flipped = (s: Sticker): Sticker => ({
  normal: [s.normal[0], -s.normal[1], -s.normal[2]],
  color: s.color,
})

/** Whether a turn carries a piece at `position`: its layer, or the right
 *  half (and what is off the layers on the right) for the slash. */
export function sectorTurns(move: SectorMove, position: Vec3): boolean {
  const place = sectorPlace(position)
  if ('flip' in move) {
    if (!place) return position[0] > 0
    return place.wide ? place.m >= 1 && place.m <= 5 : place.m <= 5
  }
  return place !== undefined && place.z === (move.layer === 'U' ? 1 : -1)
}

export function applySectorMove(cube: Cube, move: SectorMove): Cube {
  return cube.map((c) => {
    if (!sectorTurns(move, c.position)) return c
    if ('flip' in move) {
      const [x, y, z] = c.position
      return { ...c, position: [x, -y, -z], stickers: c.stickers.map(flipped) }
    }
    const place = sectorPlace(c.position)!
    const k = move.layer === 'U' ? move.steps : -move.steps
    return {
      ...c,
      position: sectorAt(mod(place.m + k, 12), place.z, place.wide),
      stickers: c.stickers.map((s) => turned(s, k)),
    }
  })
}

/** A turn as the renderer animates it, in the model's frame (x right,
 *  across the slash's cut, y along it, z up out of the top). */
export function sectorRotation(move: SectorMove): {
  axis: [number, number, number]
  angle: number
} {
  // The slash: about the axis across the cut (x), as the 2-Star's: the
  // right half stays right, its front going back and its top down.
  if ('flip' in move) return { axis: [1, 0, 0], angle: Math.PI }
  const k = move.steps > 6 ? move.steps - 12 : move.steps
  // Clockwise seen from its side: about -z on top, about z below.
  return { axis: [0, 0, 1], angle: ((move.layer === 'U' ? -k : k) * Math.PI) / 6 }
}

/** The pad's turns: each layer a twelfth either way, the slash. */
export const SECTOR_TURNS: readonly SectorMove[] = [
  ...(['U', 'D'] as const).flatMap((layer) =>
    ([1, 11] as const).map((steps): SectorMove => ({ layer, steps })),
  ),
  { flip: true },
]

export function invertSectorMove(move: SectorMove): SectorMove {
  return 'flip' in move
    ? move
    : { layer: move.layer, steps: (12 - move.steps) as typeof move.steps }
}

/** Merge consecutive turns of the same layer, cancel two slashes. */
export function simplifySectorMoves(moves: readonly SectorMove[]): SectorMove[] {
  const out: SectorMove[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last && 'flip' in last && 'flip' in move) out.pop()
    else if (last && 'layer' in last && 'layer' in move && last.layer === move.layer) {
      out.pop()
      const steps = (last.steps + move.steps) % 12
      if (steps) out.push({ layer: move.layer, steps: steps as typeof move.steps })
    } else out.push(move)
  }
  return out
}

/** A turn as written, as the star prisms' (fan2cube's): the top's signed
 *  twelfths (`2`, `-1`), the bottom's with its letter (`-2B`, `B`), the
 *  slash `/`. */
export function formatSectorMove(move: SectorMove, labels: FaceLabels): string {
  if ('flip' in move) return '/'
  const k = move.steps > 6 ? move.steps - 12 : move.steps
  if (move.layer === 'U') return String(k)
  return `${k === 1 ? '' : k === -1 ? '-' : k}${labels.D}`
}

/** Parse that notation (`/ B / 1-B / -1 /`): slashes, `+`, spaces and a
 *  sign after a turn separate turns, parentheses only help reading. */
export function parseSectorMoves(text: string, labels: FaceLabels): SectorMove[] {
  const bottom = new RegExp(`^(-?\\d*)${labels.D}$`)
  return (
    text
      .replace(/[()]/g, '')
      .replace(/\//g, ' / ')
      // `1-B`: the top turned 1, the bottom -1.
      .replace(/([\dA-Za-z])-/g, '$1 -')
      .split(/[+\s]+/)
      .filter(Boolean)
      .map((token): SectorMove => {
        if (token === '/') return { flip: true }
        const lower = bottom.exec(token)
        const n = lower
          ? lower[1] === ''
            ? 1
            : lower[1] === '-'
              ? -1
              : Number(lower[1])
          : Number(token)
        if (!Number.isInteger(n) || n % 12 === 0) throw new Error(`parseSectorMoves: "${token}"`)
        return { layer: lower ? 'D' : 'U', steps: mod(n, 12) as SectorSteps }
      })
  )
}
