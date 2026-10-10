import { cubeShape, normalIndex, solvedCube } from './cube'
import type { Color, Cube, Cubie, Vec3 } from './types'

/**
 * Text form of a cube state, to keep it across reloads (see savedStore).
 * One token per cubie, in array order: its position, then each sticker as
 * its normal index (0..5, see `normalIndex`) and color, e.g. `1,1,1:2W0R4G`.
 * It records the cube as it is, so it fits every shape, including one whose
 * pieces stand out of the box.
 */

const NORMALS: readonly Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]

const COLORS = new Set<string>(['W', 'Y', 'G', 'B', 'O', 'R'])

export function encodeCube(cube: Cube): string {
  return cube
    .map(
      (c) =>
        `${c.position.join(',')}:${c.stickers.map((s) => `${normalIndex(s.normal)}${s.color}`).join('')}`,
    )
    .join(' ')
}

function decodeCubie(token: string): Cubie | null {
  const match = /^(-?\d+),(-?\d+),(-?\d+):((?:[0-5][A-Z])*)$/.exec(token)
  if (!match) return null
  const stickers = (match[4]!.match(/../g) ?? []).map((s) => ({
    normal: NORMALS[Number(s[0])]!,
    color: s[1] as Color,
  }))
  if (!stickers.every((s) => COLORS.has(s.color))) return null
  return { position: [Number(match[1]), Number(match[2]), Number(match[3])], stickers }
}

/** Color sets of a cube's pieces, sorted: equal for two states of one puzzle. */
function pieceSignature(cube: Cube): string {
  return cube
    .map((c) =>
      c.stickers
        .map((s) => s.color)
        .sort()
        .join(''),
    )
    .sort()
    .join(' ')
}

/**
 * The cube a text encodes, or null when the text is not one: malformed, or
 * not made of the pieces of a real puzzle (a corrupted or foreign entry).
 * Solvability is not re-proved: the text was saved from a legal state.
 */
export function decodeCube(text: string): Cube | null {
  const cubies = text.split(' ').map(decodeCubie)
  if (cubies.some((c) => c === null)) return null
  const cube = cubies as Cubie[]
  try {
    return pieceSignature(cube) === pieceSignature(solvedCube(cubeShape(cube))) ? cube : null
  } catch {
    return null // no puzzle has that many cubies
  }
}
