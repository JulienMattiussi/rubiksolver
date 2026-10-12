import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/cube'
import { formatMoves, parseMoves, scrambleTurns } from '@/lib/moves'
import { methodsFor } from '@/lib/solver'
import { centersDone, solveCenters } from '@/lib/solver5/centers'
import { EDGE_PARITY, edgesPaired, pairEdges, pairedOrParity } from '@/lib/solver5/edges'
import { isReduced } from '@/lib/solver5/project'
import { applyMoves } from '@/lib/turn'
import type { Cube } from '@/lib/types'
import { validateCube } from '@/lib/validate'
import { seededRng, twistedCorner } from '../helpers'

const SOLVED = solvedCube('5')
const scrambled = (seed: number) =>
  applyMoves(SOLVED, scrambleTurns('5', 60, seededRng(seed), SOLVED))

/** The pieces a sequence moves or turns, by kind of position. */
const moved = (cube: Cube) =>
  cube.filter((c, i) => {
    const home = SOLVED[i]!
    return (
      c.stickers.length > 0 &&
      (c.position.join() !== home.position.join() ||
        c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join()))
    )
  })

describe('5x5', () => {
  it('writes its middle slices 3R, read back as such', () => {
    const moves = parseMoves("3R 3U' 2F2 Rw")
    expect(moves[0]).toEqual({ face: 'R', amount: 1, depth: 3 })
    expect(formatMoves(moves)).toBe("3R 3U' 2F2 Rw")
  })

  it('swaps the UF edge wings with the parity algorithm, and only same-color centers else', () => {
    const after = applyMoves(SOLVED, EDGE_PARITY)
    // The two UF wings, then U's centers traded among themselves.
    const wings = moved(after).filter((c) => c.stickers.length === 2)
    expect(wings.map((c) => c.position.join()).sort()).toEqual(['-1,2,2', '1,2,2'])
    expect(moved(after).every((c) => c.stickers.length === 2 || c.position[1] === 2)).toBe(true)
    expect(centersDone(after)).toBe(true)
    expect(pairedOrParity(after) && !edgesPaired(after)).toBe(true)
  })

  it('solves the centers by face, then pairs the edges keeping them', () => {
    const cube = scrambled(1)
    const centered = applyMoves(cube, solveCenters(cube))
    expect(centersDone(centered)).toBe(true)
    const paired = applyMoves(centered, pairEdges(centered))
    expect(centersDone(paired) && pairedOrParity(paired)).toBe(true)
  })

  it('meets the edge parity on some scrambles, and solves them all', () => {
    const [method] = methodsFor('5')
    let parities = 0
    for (let seed = 0; seed < 8; seed++) {
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
    expect(validateCube(twistedCorner('5'))).toEqual({ ok: false, error: 'impossible' })
  }, 60000)
})
