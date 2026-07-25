import { describe, expect, it } from 'vitest'
import { solveProgress } from '@/lib/progress'

describe('solveProgress', () => {
  const lengths = [5, 10, 3] // total 18

  it('reports total and no progress before playing', () => {
    const p = solveProgress(lengths, 0, 0)
    expect(p.total).toBe(18)
    expect(p.consumed).toBe(0)
    expect(p.steps.map((s) => s.done)).toEqual([false, false, false])
    expect(p.steps[0]!.current).toBe(true)
  })

  it('marks a step done only once fully animated', () => {
    // First step dispatched (5 moves), none waiting -> 5 consumed.
    const p = solveProgress(lengths, 5, 0)
    expect(p.consumed).toBe(5)
    expect(p.steps[0]!.done).toBe(true)
    expect(p.steps[1]!.current).toBe(true)
    expect(p.steps[1]!.done).toBe(false)
  })

  it('accounts for moves still queued', () => {
    // All 18 dispatched but 10 still waiting -> 8 consumed (mid step 2).
    const p = solveProgress(lengths, 18, 10)
    expect(p.consumed).toBe(8)
    expect(p.steps[0]!.done).toBe(true)
    expect(p.steps[1]!.current).toBe(true)
  })

  it('marks everything done when fully consumed', () => {
    const p = solveProgress(lengths, 18, 0)
    expect(p.steps.every((s) => s.done)).toBe(true)
    expect(p.steps.some((s) => s.current)).toBe(false)
  })
})
