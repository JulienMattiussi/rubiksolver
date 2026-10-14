import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/cube'
import { BOTTOM_TWISTS, CENTER_SWAPS, CENTER_TURN, TOP_TWISTS } from '@/lib/methods/skewbU'
import { parseDinoMoves } from '@/lib/rainbow'
import { applyMoves } from '@/lib/turn'

const SOLVED = solvedCube('skewbU')

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

/** Only what moves among the top corners, or among the centers. */
const top = (formula: string) => effect(formula).filter((e) => /^[ADPG][°-]/.test(e))
const centers = (formula: string) => effect(formula).filter((e) => e.startsWith('('))

describe('Skewb Ultimate', () => {
  it('does what fan2cube.fr says of each formula', () => {
    // G- = [BO], A+ = [O'B'], P- = [OH], D+ = [B'E'].
    expect(TOP_TWISTS.map(top)).toEqual([['G°'], ['A°'], ['P°'], ['D°']])
    // (A)<->(P), (G)<->(D), (A)->(G)->(B), (D)->(A)->(B).
    expect(centers(CENTER_SWAPS[0]!)).toEqual(expect.arrayContaining(['(A)->(P)', '(P)->(A)']))
    expect(centers(CENTER_SWAPS[1]!)).toEqual(expect.arrayContaining(['(D)->(G)', '(G)->(D)']))
    expect(centers(CENTER_SWAPS[2]!)).toEqual(['(A)->(G)', '(B)->(A)', '(G)->(B)'])
    expect(centers(CENTER_SWAPS[3]!)).toEqual(['(A)->(B)', '(B)->(D)', '(D)->(A)'])
    // (A)°(G)° = [HE']²[EB']², the top untouched.
    expect(centers(CENTER_TURN)).toEqual(['(A)°', '(G)°'])
    expect(top(CENTER_TURN)).toEqual([])
    // K = [BO']⁴ and Z = [OH']⁴ twist the bottom corners alone.
    for (const formula of BOTTOM_TWISTS) expect(effect(formula)).toEqual(['B°', 'E°', 'H°', 'O°'])
  })
})
