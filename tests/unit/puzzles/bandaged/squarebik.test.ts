import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/notation'
import { turnAllowed } from '@/lib/core/turn'
import type { Face } from '@/lib/core/types'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import { CYCLE, DOWN, SQUAREBIK_PLAN, SWAP, TWIST } from '@/lib/methods/bandaged/squarebik'
import { effect } from './pageEffect'

const SOLVED = solvedCube('squarebik')

describe('Squarebik', () => {
  it('turns H, B and D only, its equator’s left half never moving', () => {
    const faces = (['U', 'D', 'L', 'R', 'F', 'B'] as Face[]).filter((face) =>
      turnAllowed(SOLVED, { face, amount: 1 }),
    )
    expect(faces).toEqual(['U', 'D', 'R'])
    expect(formsOfBlocks(SOLVED)).toHaveLength(1)
  })

  it('brings (HDA) down to (BAD) with [DH]', () => {
    expect(effect('squarebik', DOWN)).toContain('(HAD)->(BAD)')
  })

  it('cycles (HG) -> (HD) -> (HA) with E, nothing else moved', () => {
    expect(effect('squarebik', CYCLE)).toEqual(['(HA)->(HG)', '(HD)->(HA)', '(HG)->(HD)'])
  })

  it('swaps (HAG) and (HDA), only the top moved', () => {
    const fx = effect('squarebik', SWAP)
    expect(fx).toContain('(HAG)->(HAD)')
    expect(fx).toContain('(HAD)->(HAG)')
    expect(fx.every((e) => e.startsWith('(H'))).toBe(true)
  })

  it('turns three top corners with DHD’H.DH²D’H²', () => {
    expect(effect('squarebik', TWIST).filter((e) => e.length === 6)).toEqual([
      '(HAD)°',
      '(HPD)°',
      '(HPG)°',
    ])
  })

  it('solves with H, B and D at every step', () => {
    expect(
      SQUAREBIK_PLAN.map((s) => s.moves.generators.map((m) => formatMove(m)).join(' ')),
    ).toEqual(Array(SQUAREBIK_PLAN.length).fill('U D R'))
  })
})
