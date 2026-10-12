import type { FaceLabels } from './moves'
import { invertPyraMove, PYRA_VERTICES } from './pyraminx'
import type { PyraMove, PyraVertex } from './types'

/**
 * The notation of the Pyraminxes (see pyraminx.ts for the puzzles): how a
 * turn is written in each notation, and fan2cube's formulas read.
 */

/** Letter of each corner: the international ones, or fan2cube's French
 *  Haut, Gauche, Droite, Postérieur (whose B, Bas, is a face here). */
const LETTERS: Record<'us' | 'fr', Record<PyraVertex, string>> = {
  us: { U: 'U', L: 'L', R: 'R', B: 'B' },
  fr: { U: 'H', L: 'G', R: 'D', B: 'P' },
}

/**
 * Each notation's own convention, as its users write it. International
 * (WCA): a layer is the uppercase letter (`R`), its tip alone the lowercase
 * one (`r`). French, as fan2cube.fr writes it: the tip (`sommet`) is the
 * uppercase letter (`D`), the layer (`tranche`) the lowercase one (`d`).
 * Either way `'` turns back (fan2cube's `²`, two thirds, is the same turn).
 *
 * A Jing turn, the corner's half, is its uppercase letter in both (`D`, `R`),
 * as fan2cube writes it.
 *
 * A Master Pyraminx slice: in French fan2cube's numbered slices, `H'₁` (its
 * prime before the number, as the page writes it); in English the slice
 * number as a prefix, counting the tip as the first layer (`2U'`, SiGN
 * style). Its tips are written as the Pyraminx's.
 */
function notationOf(labels: FaceLabels): {
  letters: Record<PyraVertex, string>
  tipUpper: boolean
} {
  const fr = labels.U !== 'U'
  return { letters: LETTERS[fr ? 'fr' : 'us'], tipUpper: fr }
}

export function formatPyraMove(move: PyraMove, labels: FaceLabels): string {
  const { letters, tipUpper } = notationOf(labels)
  const letter = letters[move.vertex]
  const prime = move.amount === 2 ? "'" : ''
  if (move.deep) return letter + prime
  if (move.slice) {
    return tipUpper
      ? `${letter}${prime}${SUBSCRIPTS[move.slice]}`
      : `${move.slice + 1}${letter}${prime}`
  }
  const upper = !!move.tip === tipUpper
  return (upper ? letter : letter.toLowerCase()) + prime
}

const SUBSCRIPTS = '₀₁₂₃₄'

/**
 * Parse fan2cube's formulas, `[gd'][h'd]` or `dhd'hdhd'` style: one letter
 * per turn, `'` or `²` (or `2`) to turn back, `[a b]` the commutator
 * a b a' b'. Spaces, dots and parentheses only help reading. On the Master
 * and the Professor (`size` 4 or 5), the slices: `H'1` or `H'₁` (`H1'` too, and `h` for `H1`), or
 * `2U'` in English. On the Jing (`size` 2), uppercase letters, its halves.
 */
export function parsePyraMoves(text: string, labels: FaceLabels, size = 3): PyraMove[] {
  const { letters, tipUpper } = notationOf(labels)
  const token =
    size < 4
      ? /([A-Za-z])(['²2]?)/y
      : tipUpper
        ? /([A-Za-z])(['²]?)([0-4₀-₄]?)(['²]?)/y
        : /([1-5]?)([A-Za-z])(['²]?)/y
  const moves: PyraMove[] = []
  let bracket: PyraMove[] | null = null
  let at = 0
  while (at < text.length) {
    const char = text[at]!
    if (/[\s.()]/.test(char)) {
      at++
      continue
    }
    if (char === '[') {
      if (bracket) break
      bracket = []
      at++
      continue
    }
    if (char === ']') {
      if (!bracket || bracket.length !== 2) throw new Error(`Invalid commutator in "${text}"`)
      const [a, b] = bracket as [PyraMove, PyraMove]
      moves.push(a, b, invertPyraMove(a), invertPyraMove(b))
      bracket = null
      at++
      continue
    }
    token.lastIndex = at
    const match = token.exec(text)
    const move = match && readMove(match, size, letters, tipUpper)
    if (!match || !move) throw new Error(`Invalid Pyraminx turn in "${text}" at ${at}`)
    ;(bracket ?? moves).push(move)
    at = token.lastIndex
  }
  if (bracket) throw new Error(`Invalid Pyraminx formula: "${text}"`)
  return moves
}

function readMove(
  match: RegExpExecArray,
  size: number,
  letters: Record<PyraVertex, string>,
  tipUpper: boolean,
): PyraMove | null {
  const english = size >= 4 && !tipUpper
  const letter = (english ? match[2] : match[1])!
  const vertex = PYRA_VERTICES.find((v) => letters[v] === letter.toUpperCase())
  if (!vertex) return null
  const upper = letter === letter.toUpperCase()
  const amount = (english ? match[3] : match[2] || match[4]) ? 2 : 1
  if (size === 2) return upper ? { vertex, amount, deep: true } : null
  if (size === 3) {
    const tip = upper === tipUpper
    return { vertex, amount, ...(tip && { tip: true }) }
  }
  // The Master and the Professor: a number names the slice, the bare letter
  // the tip (`H`, `u`), fan2cube's lowercase letter its first slice.
  const digit = english ? match[1] : match[3]
  const slice = digit ? Math.max(0, SUBSCRIPTS.indexOf(digit), Number(digit) || 0) : 0
  const depth = english ? (digit ? slice - 1 : upper ? -1 : 0) : !upper ? (digit ? -1 : 1) : slice
  if (depth < 0 || depth > size - 1) return null
  return depth === 0
    ? { vertex, amount, tip: true }
    : { vertex, amount, slice: depth as 1 | 2 | 3 | 4 }
}
