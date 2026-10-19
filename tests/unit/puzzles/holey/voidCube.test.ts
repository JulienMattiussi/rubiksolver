import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import type { Vec3 } from '@/lib/core/types'
import {
  DOWN_CORNER,
  DOWN_EDGE,
  FLIP_EDGE,
  RAISE_EDGE,
  SWAP_EDGES,
  VOID_CUBE_PLAN,
} from '@/lib/methods/holey/voidCube'
import { buildSteps } from '@/lib/solve/solverKit'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('void')

/** fan2cube's names of the slots: H B A P G D = U D F B L R. */
const LETTER: Record<string, string> = {
  '0,1,0': 'H',
  '0,-1,0': 'B',
  '0,0,1': 'A',
  '0,0,-1': 'P',
  '-1,0,0': 'G',
  '1,0,0': 'D',
}
const ORDER = 'HBAPGD'
const nameOf = (p: Vec3) =>
  p
    .flatMap((v, a) => {
      const unit = [0, 0, 0]
      unit[a] = v
      return v ? [LETTER[unit.join()]!] : []
    })
    .sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y))
    .join('')

/** What a formula does, as the page writes it: (HA)->(BA) for a piece
 *  moved, (BA)° for one turned in place. */
function effect(formula: string): string[] {
  const after = applyMoves(SOLVED, parseMoves(formula))
  return after
    .flatMap((c, i) => {
      const home = SOLVED[i]!
      if (c.position.join() !== home.position.join()) {
        return [`(${nameOf(home.position)})->(${nameOf(c.position)})`]
      }
      const turned = c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`(${nameOf(home.position)})°`] : []
    })
    .sort()
}

/** The same, on the pieces outside the top layer. */
const below = (formula: string) => effect(formula).filter((e) => !/^\(H/.test(e))

describe('Void Cube', () => {
  it('is a 3x3 without centers: 8 corners, 12 edges, the hidden core', () => {
    expect(SOLVED.filter((c) => c.stickers.length === 1)).toHaveLength(0)
    expect(SOLVED.filter((c) => c.stickers.length === 0)).toHaveLength(1)
  })

  it('does what fan2cube.fr says of each formula', () => {
    // (HDA) -> (BAD) = [DH], the only bottom piece it moves.
    expect(effect(DOWN_CORNER)).toContain('(HAD)->(BAD)')
    expect(below(DOWN_CORNER)).toEqual(['(AD)->(HD)', '(BAD)->(HAD)'])
    // (HA) -> (BA) = [Hd], the corners kept.
    expect(effect(DOWN_EDGE)).toEqual([
      '(BA)->(HD)',
      '(HA)->(BA)',
      '(HD)->(HG)',
      '(HG)->(HP)',
      '(HP)->(HA)',
    ])
    // (HA)° = dHd'H.
    expect(effect(FLIP_EDGE)).toContain('(HA)°')
    // (AD) -> top = [HD][H'A'], the bottom kept.
    expect(effect(RAISE_EDGE)).toContain('(AD)->(HP)')
    expect(below(RAISE_EDGE)).toEqual(['(AD)->(HP)'])
    // X swaps (HA) and (HD), nothing else: a 3x3 never can.
    expect(effect(SWAP_EDGES)).toEqual(['(HA)->(HD)', '(HD)->(HA)'])
  })

  it('swaps two edges alone, which a 3x3 cannot: a singularity', () => {
    const swapped = applyMoves(SOLVED, parseMoves(SWAP_EDGES))
    expect(buildSteps(swapped, VOID_CUBE_PLAN).map((s) => s.key)).toContain('stepVoidSingularity')
  })

  it('solves its scrambles, a singularity in about half', () => {
    let singular = 0
    for (let seed = 1; seed <= 6; seed++) {
      const cube = applyMoves(SOLVED, scrambleTurns('void', 25, seededRng(seed), SOLVED))
      const keys = buildSteps(cube, VOID_CUBE_PLAN).map((s) => s.key)
      if (keys.includes('stepVoidSingularity')) singular++
    }
    expect(singular).toBeGreaterThan(0)
    expect(singular).toBeLessThan(6)
  })
})
