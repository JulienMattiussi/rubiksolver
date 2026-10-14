import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { tablesFor } from '@/lib/editor/editorTables'
import { formatMoves, parseMoves, scrambleTurns } from '@/lib/core/moves'
import { methodsFor } from '@/lib/solve/solver'
import { centersDone } from '@/lib/methods/standard/solver6/centers'
import {
  edgesPaired,
  INNER_PARITY,
  OUTER_PARITY,
  pairedOrParity,
} from '@/lib/methods/standard/solver6/edges'
import { isReduced } from '@/lib/methods/standard/solver6/project'
import { applyMoves } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'
import { validateCube } from '@/lib/editor/validate'
import { seededRng, twistedCorner } from '../../../helpers'

const SOLVED = solvedCube('6')
const scrambled = (seed: number) =>
  applyMoves(SOLVED, scrambleTurns('6', 80, seededRng(seed), SOLVED))

/** The wings a sequence moves, by slot. */
const movedWings = (cube: Cube) =>
  cube
    .filter((c, i) => c.stickers.length === 2 && c.position.join() !== SOLVED[i]!.position.join())
    .map((c) => c.position.join())
    .sort()

describe('6x6', () => {
  it('writes its third layers 3R and three-layer wide turns 3Rw, read back as such', () => {
    const moves = parseMoves("3R 3Rw' 2F2 Rw")
    expect(moves[1]).toEqual({ face: 'R', amount: 3, depth: 3, wide: true })
    expect(formatMoves(moves)).toBe("3R 3Rw' 2F2 Rw")
  })

  it('swaps the UF edge’s outer wings, or its inner ones, centers kept', () => {
    const outer = applyMoves(SOLVED, OUTER_PARITY)
    expect(movedWings(outer)).toEqual(['-3,5,5', '3,5,5'])
    const inner = applyMoves(SOLVED, INNER_PARITY)
    expect(movedWings(inner)).toEqual(['-1,5,5', '1,5,5'])
    for (const after of [outer, inner]) {
      expect(centersDone(after)).toBe(true)
      expect(pairedOrParity(after) && !edgesPaired(after)).toBe(true)
    }
  })

  it('tells its obliques of either hand apart in entry: four of each per color', () => {
    const { budgets } = tablesFor('6')
    const obliques = [...budgets].filter(([key]) => key.startsWith('C:1,3,5'))
    expect(obliques).toHaveLength(12)
    expect(obliques.every(([, n]) => n === 4)).toBe(true)
  })

  it('meets either edge parity on some scrambles, and solves them all', () => {
    const [method] = methodsFor('6')
    let parities = 0
    for (let seed = 0; seed < 4; seed++) {
      const cube = scrambled(seed)
      const steps = method!.solve(cube)
      if (steps.some((s) => s.key === 'stepParity')) parities++
      const reducedAt = steps.findIndex((s) => s.key === 'stepBottomCross')
      const reduced = applyMoves(
        cube,
        steps.slice(0, reducedAt).flatMap((s) => [...s.moves]),
      )
      expect(isReduced(reduced)).toBe(true)
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
  }, 60000)

  it('rejects a twisted corner', () => {
    expect(validateCube(twistedCorner('6'))).toMatchObject({ ok: false, error: 'impossible' })
  }, 60000)
})
