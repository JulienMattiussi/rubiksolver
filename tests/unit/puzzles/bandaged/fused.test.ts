import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/notation'
import { turnAllowed } from '@/lib/core/turn'
import type { Face } from '@/lib/core/types'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import { CYCLE, FLIP, FUSED_PLAN, SWAP, TWIST } from '@/lib/methods/bandaged/fused'
import { effect } from './pageEffect'

const SOLVED = solvedCube('fused')
const turning = () =>
  (['U', 'D', 'L', 'R', 'F', 'B'] as Face[]).filter((face) =>
    turnAllowed(SOLVED, { face, amount: 1 }),
  )

describe('Fused', () => {
  it('turns H, A and D only, its 2x2x2 never moving', () => {
    expect(turning()).toEqual(['U', 'R', 'F'])
    expect(formsOfBlocks(SOLVED)).toHaveLength(1)
  })

  it('turns two top edges over with A[HD]A’, the rest of the top moved', () => {
    const fx = effect('fused', FLIP)
    expect(fx.every((e) => e.startsWith('(H'))).toBe(true)
    expect(fx).toContain('(HA)->(HP)')
  })

  it('swaps (HDA) and (HPD) with V, two top edges with them', () => {
    expect(effect('fused', SWAP)).toEqual([
      '(HA)->(HD)',
      '(HAD)->(HPD)',
      '(HD)->(HA)',
      '(HPD)->(HAD)',
    ])
  })

  it('turns three top corners with DHD’H.DH²D’H², cycling three top edges', () => {
    expect(effect('fused', TWIST)).toEqual([
      '(HA)->(HP)',
      '(HAD)°',
      '(HD)->(HA)',
      '(HP)->(HD)',
      '(HPD)°',
      '(HPG)°',
    ])
  })

  it('cycles (HG) -> (HD) -> (HA) with E, nothing else moved', () => {
    expect(effect('fused', CYCLE)).toEqual(['(HA)->(HG)', '(HD)->(HA)', '(HG)->(HD)'])
  })

  it('solves with H, A and D at every step', () => {
    expect(FUSED_PLAN.map((s) => s.moves.generators.map((m) => formatMove(m)).join(' '))).toEqual(
      Array(FUSED_PLAN.length).fill('U R F'),
    )
  })
})
