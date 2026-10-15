import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { allTurnsOf } from '@/lib/core/moveSet'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import {
  CORNERS,
  CYCLE_TOP,
  EDGES,
  EDGES_BACK,
  FUSED_STRIPE_PLAN,
  J,
  J2,
  J4,
  M,
} from '@/lib/methods/bandaged/fusedStripe'
import { effect } from './pageEffect'

const SOLVED = solvedCube('fusedStripe')

describe('FusedStripe', () => {
  it('has its 450 forms, as the page counts them', () => {
    expect(formsOfBlocks(SOLVED)).toHaveLength(450)
  })

  it('plays each formula of its method, as its effect says', () => {
    expect(effect('fusedStripe', CORNERS)).toEqual([
      '(AG)->(HP)',
      '(BAG)->(HAD)',
      '(BD)->(HG)',
      '(HAD)->(BAG)',
      '(HG)->(AG)',
      '(HP)->(BD)',
      '(HPG)\u00b0',
    ])
    expect(effect('fusedStripe', EDGES)).toEqual([
      '(BA)->(PD)',
      '(BAG)\u00b0',
      '(BPD)\u00b0',
      '(HAD)\u00b0',
      '(HP)->(BA)',
      '(HPG)\u00b0',
      '(PD)->(HP)',
    ])
    expect(effect('fusedStripe', EDGES_BACK)).toEqual(['(BD)->(HG)', '(HG)->(HP)', '(HP)->(BD)'])
    expect(effect('fusedStripe', M)).toEqual([
      '(AD)->(AG)',
      '(AG)->(BA)',
      '(BA)->(HG)',
      '(BAD)->(BAG)',
      '(BAG)->(HPG)',
      '(BD)->(HP)',
      '(BPD)->(HAG)',
      '(HA)->(AD)',
      '(HAD)\u00b0',
      '(HAG)->(BAD)',
      '(HD)->(PD)',
      '(HG)->(HA)',
      '(HP)->(HD)',
      '(HPD)->(BPD)',
      '(HPG)->(HPD)',
      '(PD)->(BD)',
    ])
  })

  it('plays J, J², J⁴ and A[DH]²A\u2019 in state m (after M), its top turning', () => {
    expect(() => effect('fusedStripe', J, M)).not.toThrow()
    expect(() => effect('fusedStripe', J2, M)).not.toThrow()
    expect(() => effect('fusedStripe', J4, M)).not.toThrow()
    expect(() => effect('fusedStripe', CYCLE_TOP, M)).not.toThrow()
  })

  it('solves with the turns it has, at every step', () => {
    const turns = allTurnsOf('fusedStripe').generators.map((m) => ('face' in m ? m.face : ''))
    for (const step of FUSED_STRIPE_PLAN) {
      expect(step.moves.generators.map((m) => ('face' in m ? m.face : ''))).toEqual(turns)
    }
  })
})
