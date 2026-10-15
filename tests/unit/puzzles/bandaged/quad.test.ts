import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { allTurnsOf } from '@/lib/core/moveSet'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import {
  CORNER_DOWN,
  CORNER_LEFT,
  CORNER_LONG,
  CORNER_RIGHT,
  EDGE_LONG,
  EDGE_SHORT,
  K,
  QUAD_PLAN,
} from '@/lib/methods/bandaged/quad'
import { effect } from './pageEffect'

const SOLVED = solvedCube('quad')

describe('Quad', () => {
  it('has its 25 forms', () => {
    expect(formsOfBlocks(SOLVED)).toHaveLength(25)
  })

  it('plays each formula of its method, as its effect says', () => {
    expect(effect('quad', EDGE_SHORT)).toEqual([
      '(BAG)->(BPG)',
      '(BG)->(PG)',
      '(BP)->(BG)',
      '(BPD)->(HPG)',
      '(BPG)->(BAG)',
      '(HPG)->(BPD)',
      '(PG)->(BP)',
    ])
    expect(effect('quad', EDGE_LONG)).toEqual([
      '(BAG)->(HPG)',
      '(BG)->(BP)',
      '(BP)->(BG)',
      '(BPD)->(BPG)',
      '(BPG)->(BAG)',
      '(HPG)->(BPD)',
    ])
    expect(effect('quad', CORNER_RIGHT)).toEqual([
      '(BAG)->(HPG)',
      '(BPD)->(BPG)',
      '(BPG)->(BPD)',
      '(HPG)->(BAG)',
    ])
    expect(effect('quad', CORNER_LEFT)).toEqual([
      '(BAG)->(BPD)',
      '(BPD)->(BAG)',
      '(BPG)->(HPG)',
      '(HPG)->(BPG)',
    ])
    expect(effect('quad', CORNER_DOWN)).toEqual([
      '(BAG)->(BPG)',
      '(BPD)->(HPG)',
      '(BPG)->(BAG)',
      '(HPG)->(BPD)',
    ])
    expect(effect('quad', CORNER_LONG)).toEqual([
      '(BAG)->(BPG)',
      '(BG)\u00b0',
      '(BPD)->(BAG)',
      '(BPG)->(BPD)',
      '(HPG)\u00b0',
      '(PG)\u00b0',
    ])
    expect(effect('quad', K)).toEqual(['(BG)\u00b0', '(BP)\u00b0', '(BPD)\u00b0', '(BPG)\u00b0'])
  })

  it('solves with the turns it has, at every step', () => {
    const turns = allTurnsOf('quad').generators.map((m) => ('face' in m ? m.face : ''))
    for (const step of QUAD_PLAN) {
      expect(step.moves.generators.map((m) => ('face' in m ? m.face : ''))).toEqual(turns)
    }
  })
})
