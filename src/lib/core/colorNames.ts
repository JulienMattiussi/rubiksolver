import type { Color } from './types'

/**
 * A color's name on a puzzle: a shade (dark green, lime green, dark blue,
 * pale pink) is told apart from its color only where the puzzle wears
 * another shade of it (the Rainbow's three greens); alone, it is just
 * green (the Gear Cube Ultimate's dark green).
 */

/** The plain color each shade is one of. */
const SHADE_OF: Partial<Record<Color, Color>> = { E: 'G', L: 'G', N: 'B', K: 'P' }

const plainOf = (color: Color): Color => SHADE_OF[color] ?? color

/** The color whose name `color` takes on a puzzle wearing `colors`: its
 *  plain one, unless another shade of it is there too. */
export function namedAs(color: Color, colors: readonly Color[]): Color {
  const plain = plainOf(color)
  return colors.filter((c) => plainOf(c) === plain).length > 1 ? color : plain
}
