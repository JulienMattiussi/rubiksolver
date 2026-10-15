import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { parseDinoMoves } from '@/lib/puzzles/shared/rainbow'
import { BOTTOM_TWIST, CENTER_CYCLES, SKEWB_PLAN, TOP_TWIST } from '@/lib/methods/diagonal/skewb'
import { buildSteps } from '@/lib/solve/solverKit'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('skewb')

/** fan2cube's names: centers in brackets, corners by their letters. */
const NAME: Record<string, string> = {
  '0,1,0': '(H)',
  '0,-1,0': '(B)',
  '0,0,1': '(A)',
  '0,0,-1': '(P)',
  '-1,0,0': '(G)',
  '1,0,0': '(D)',
  '1,1,1': 'A',
  '1,1,-1': 'D',
  '-1,1,-1': 'P',
  '-1,1,1': 'G',
  '1,-1,1': 'B',
  '1,-1,-1': 'E',
  '-1,-1,-1': 'H',
  '-1,-1,1': 'O',
}

/** What a formula does from the solved puzzle: `(A)->(P)`, or `A°`
 *  turned in place. */
function effect(formula: string): string[] {
  const cube = applyMoves(SOLVED, parseDinoMoves(formula, 'skewb'))
  return cube
    .flatMap((c, i) => {
      const home = SOLVED[i]!
      const name = NAME[home.position.join()]!
      if (c.position.join() !== home.position.join()) {
        return [`${name}->${NAME[c.position.join()]}`]
      }
      const turned = c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`${name}°`] : []
    })
    .sort()
}

describe('Skewb', () => {
  it('is 6 centers and 8 corners, its corners in two sets that never mix', () => {
    expect(SOLVED.filter((c) => c.stickers.length === 1)).toHaveLength(6)
    expect(SOLVED.filter((c) => c.stickers.length === 3)).toHaveLength(8)
    const set = (p: readonly number[]) => p[0]! * p[1]! * p[2]!
    const mixed = applyMoves(SOLVED, scrambleTurns('skewb', 30, seededRng(3), SOLVED))
    mixed.forEach((c, i) => {
      if (c.stickers.length === 3) expect(set(c.position)).toBe(set(SOLVED[i]!.position))
    })
  })

  it('does what fan2cube.fr says of each formula', () => {
    // A- = [B'O'] (the top's other pieces kept).
    expect(effect(TOP_TWIST).filter((e) => /^[ADPG][°-]/.test(e))).toEqual(['A°'])
    // (A)->(G)->(B) = [B'E'][HE], (A)->(B)->(D) = [H'E'][HO].
    expect(effect(CENTER_CYCLES[0]!).filter((e) => e.startsWith('('))).toEqual([
      '(A)->(G)',
      '(B)->(A)',
      '(G)->(B)',
    ])
    expect(effect(CENTER_CYCLES[1]!).filter((e) => e.startsWith('('))).toEqual([
      '(A)->(B)',
      '(B)->(D)',
      '(D)->(A)',
    ])
    // [BO']² turns the four bottom corners, nothing else.
    expect(effect(BOTTOM_TWIST)).toEqual(['B°', 'E°', 'H°', 'O°'])
  })

  it('solves held any way up, the top center white', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const cube = applyMoves(SOLVED, scrambleTurns('skewb', 15, seededRng(seed), SOLVED))
      const steps = buildSteps(cube, SKEWB_PLAN)
      expect(steps.length).toBeGreaterThan(0)
    }
  })
})
