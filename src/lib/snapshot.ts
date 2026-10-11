import { colorsOf, cubeShape, solvedCube } from './cube'
import { normalIndex, normalOfIndex } from './geometry'
import { ALL_COLORS, type Color, type Cube, type Cubie } from './types'

/**
 * Text form of a cube state, to keep it across reloads (see savedStore).
 * One token per cubie, in array order: its position, then each sticker as
 * its normal index (one base-36 digit, see `normalIndex`) and color, e.g.
 * `1,1,1:2W0R4G`.
 * It records the cube as it is, so it fits every shape, including one whose
 * pieces stand out of the box.
 */

const KNOWN_COLORS = new Set<string>(ALL_COLORS)

export function encodeCube(cube: Cube): string {
  return cube
    .map(
      (c) =>
        `${c.position.join(',')}:${c.stickers.map((s) => `${normalIndex(s.normal).toString(36)}${s.color}`).join('')}`,
    )
    .join(' ')
}

function decodeCubie(token: string): Cubie | null {
  const match = /^(-?\d+),(-?\d+),(-?\d+):((?:[0-9ab][A-Z])*)$/.exec(token)
  if (!match) return null
  const stickers = (match[4]!.match(/../g) ?? []).map((s) => ({
    normal: normalOfIndex(parseInt(s[0]!, 36)),
    color: s[1] as Color,
  }))
  if (!stickers.every((s) => KNOWN_COLORS.has(s.color))) return null
  return { position: [Number(match[1]), Number(match[2]), Number(match[3])], stickers }
}

/** Color sets of a cube's pieces, sorted: equal for two states of one puzzle. */
function pieceSignature(cube: Cube): string {
  return cube.map(colorsOf).sort().join(' ')
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
