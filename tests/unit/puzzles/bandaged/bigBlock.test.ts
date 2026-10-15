import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { formatMove, scrambleTurns } from '@/lib/core/moves'
import { applyMoves, turnAllowed } from '@/lib/core/turn'
import type { Face, Move } from '@/lib/core/types'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import { BIG_BLOCK_PLAN, CYCLE, CYCLE_BACK, TWIST } from '@/lib/methods/bandaged/bigBlock'
import { topCornersPlaced } from '@/lib/methods/bandaged/kit'
import { buildSteps } from '@/lib/solve/solverKit'
import { seededRng } from '../../../helpers'
import { effect } from './pageEffect'

const SOLVED = solvedCube('bigBlock')

describe('BigBlock', () => {
  it('turns H and D only, its 2x2x3 never moving', () => {
    const faces = (['U', 'D', 'L', 'R', 'F', 'B'] as Face[]).filter((face) =>
      turnAllowed(SOLVED, { face, amount: 1 }),
    )
    expect(faces).toEqual(['U', 'R'])
    expect(formsOfBlocks(SOLVED)).toHaveLength(1)
  })

  it('turns three top corners with DHD’H.DH²D’H²', () => {
    expect(effect('bigBlock', TWIST).filter((e) => e.length === 6)).toEqual([
      '(HAD)°',
      '(HPD)°',
      '(HPG)°',
    ])
  })

  it('cycles three top edges with each 3-cycle, nothing else moved', () => {
    expect(effect('bigBlock', CYCLE_BACK)).toEqual(['(HA)->(HD)', '(HD)->(HP)', '(HP)->(HA)'])
    expect(effect('bigBlock', CYCLE)).toEqual(['(HA)->(HG)', '(HD)->(HA)', '(HG)->(HD)'])
  })

  it('has its top corners placed, up to H, once its two bottom ones are', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const cube = applyMoves(SOLVED, scrambleTurns('bigBlock', 25, seededRng(seed), SOLVED))
      const [bottom] = buildSteps(cube, BIG_BLOCK_PLAN.slice(0, 1))
      const done = applyMoves(cube, bottom?.moves ?? [])
      const turns = ([1, 2, 3] as const).map((amount): Move[] => [{ face: 'U', amount }])
      expect([[], ...turns].some((u) => topCornersPlaced(applyMoves(done, u)))).toBe(true)
    }
  })

  it('solves with D and H at every step', () => {
    expect(
      BIG_BLOCK_PLAN.map((s) => s.moves.generators.map((m) => formatMove(m)).join(' ')),
    ).toEqual(Array(BIG_BLOCK_PLAN.length).fill('R U'))
  })
})
