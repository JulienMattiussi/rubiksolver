import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { methodsFor } from '@/lib/solve/solver'
import { applyMoves } from '@/lib/core/turn'
import type { Cubie } from '@/lib/core/types'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('oct4')

/** fan2cube's letters (H B G D A P = U D L R F B), a lowercase letter its
 *  inner slice, `[a b]` the commutator a b a' b', read into ours. */
function fan(text: string) {
  const letter: Record<string, string> = { H: 'U', B: 'D', G: 'L', D: 'R', A: 'F', P: 'B' }
  const inverse = (t: string) => (t.endsWith("'") ? t.slice(0, -1) : t.endsWith('2') ? t : `${t}'`)
  const out: string[] = []
  let group: string[] | null = null
  for (const m of text.matchAll(/(\[)|(\])|([HBGDAPhbgdap])(['²]?)/g)) {
    if (m[1]) group = []
    else if (m[2]) {
      out.push(...group!, ...group!.map(inverse))
      group = null
    } else {
      const l = m[3]!
      const face = letter[l.toUpperCase()]!
      const turn =
        (l === l.toLowerCase() ? `2${face}` : face) + (m[4] === "'" ? "'" : m[4] ? '2' : '')
      ;(group ?? out).push(turn)
    }
  }
  return parseMoves(out.join(' '))
}

/** The page's names for the kinds: by how many coordinates are at the edge
 *  of the 4x4x4 (its centers, wings and corners). */
const kindOf = (c: Cubie) =>
  ['', 'sommet', 'arête', 'centre'][c.position.filter((v) => Math.abs(v) === 3).length]!

/** What a formula moves from solved, by kind. */
function moved(text: string): Record<string, number> {
  const after = applyMoves(SOLVED, fan(text))
  const counts: Record<string, number> = {}
  SOLVED.forEach((c, i) => {
    if (c.position.join() !== after[i]!.position.join()) {
      counts[kindOf(c)] = (counts[kindOf(c)] ?? 0) + 1
    }
  })
  return counts
}

describe("4-Trajber's Octahedron", () => {
  it('has 24 corners, 24 edges and 8 face middles, a sticker each on its octant', () => {
    expect(cubeShape(SOLVED)).toBe('oct4')
    expect(isSolved(SOLVED)).toBe(true)
    const kinds: Record<string, number> = {}
    for (const c of SOLVED) kinds[kindOf(c)] = (kinds[kindOf(c)] ?? 0) + 1
    expect(kinds).toEqual({ sommet: 24, arête: 24, centre: 8 })
    for (const c of SOLVED) {
      expect(c.stickers.map((s) => s.normal.join())).toEqual([c.position.map(Math.sign).join()])
    }
  })

  it("follows fan2cube's formulas", () => {
    // Super Revenge's T and K: three corners.
    expect(moved("g'HdH'.gHd'H'")).toEqual({ sommet: 3 })
    expect(moved("dH'g'H.d'H'gH")).toEqual({ sommet: 3 })
    // The VTO's: edges by pairs (an edge of the octahedron, a piece on each
    // face), stirring the face middles, solved last.
    expect(moved("[AD']")).toEqual({ arête: 6, centre: 4 })
    expect(moved("DHD'.H.DH²D'")).toEqual({ arête: 6, centre: 4 })
    // The Rubik's Cube's: three face middles.
    expect(moved("[HA].P'[AH]P")).toEqual({ centre: 3 })
  })

  it('meets the parity on some scrambles, and solves them all', () => {
    const [method] = methodsFor('oct4')
    let parities = 0
    for (let seed = 0; seed < 12; seed++) {
      const cube = applyMoves(SOLVED, scrambleTurns('oct4', 40, seededRng(seed), SOLVED))
      const steps = method!.solve(cube)
      if (steps.some((s) => s.key === 'stepParity')) parities++
      expect(
        isSolved(
          applyMoves(
            cube,
            steps.flatMap((s) => [...s.moves]),
          ),
        ),
      ).toBe(true)
    }
    expect(parities).toBeGreaterThan(0)
  })
})
