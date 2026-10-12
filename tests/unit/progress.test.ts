import { describe, expect, it } from 'vitest'
import { solveProgress, stepEnd, stepStart, walkFocus } from '@/lib/progress'

describe('solveProgress', () => {
  const lengths = [5, 10, 3] // total 18

  it('reports total and no progress before playing', () => {
    const p = solveProgress(lengths, 0, 0)
    expect(p.total).toBe(18)
    expect(p.steps.map((s) => s.done)).toEqual([false, false, false])
    expect(p.steps[0]!.current).toBe(true)
  })

  it('marks a step done only once fully animated', () => {
    // First step dispatched (5 moves), none waiting: 5 played.
    const p = solveProgress(lengths, 5, 0)
    expect(p.steps[0]!.done).toBe(true)
    expect(p.steps[1]!.current).toBe(true)
    expect(p.steps[1]!.done).toBe(false)
  })

  it('accounts for moves still queued', () => {
    // All 18 dispatched but 10 still waiting: 8 played (mid step 2).
    const p = solveProgress(lengths, 18, 10)
    expect(p.steps[0]!.done).toBe(true)
    expect(p.steps[1]!.current).toBe(true)
  })

  it('marks everything done when fully consumed', () => {
    const p = solveProgress(lengths, 18, 0)
    expect(p.steps.every((s) => s.done)).toBe(true)
    expect(p.steps.some((s) => s.current)).toBe(false)
  })
})

describe('stepEnd', () => {
  it('ends the step under way, however far into it', () => {
    expect(stepEnd([5, 10, 3], 0)).toBe(5)
    expect(stepEnd([5, 10, 3], 3)).toBe(5)
    expect(stepEnd([5, 10, 3], 5)).toBe(15)
    expect(stepEnd([5, 10, 3], 18)).toBe(18)
  })
})

describe('stepStart', () => {
  it('starts the step under way, or right at a boundary the one before', () => {
    expect(stepStart([5, 10, 3], 0)).toBe(0)
    expect(stepStart([5, 10, 3], 3)).toBe(0)
    expect(stepStart([5, 10, 3], 5)).toBe(0)
    expect(stepStart([5, 10, 3], 7)).toBe(5)
    expect(stepStart([5, 10, 3], 15)).toBe(5)
    expect(stepStart([5, 10, 3], 18)).toBe(15)
  })
})

describe('walkFocus', () => {
  it('keeps the focus on the move under way, from the click to its end', () => {
    // Idle on move 4 (the next to play), then one move forward.
    expect(walkFocus(4, 0, false).focus).toBe(4)
    expect(walkFocus(5, 1, false)).toEqual({ played: 4, focus: 4 }) // queued
    expect(walkFocus(5, 0, false).focus).toBe(5) // done: the next one
  })

  it('shows the move being undone when going back, then the one to replay', () => {
    expect(walkFocus(3, 1, true)).toEqual({ played: 4, focus: 3 })
    expect(walkFocus(3, 0, true).focus).toBe(3)
  })

  it('shows the first move before anything is played', () => {
    expect(walkFocus(0, 0, false)).toEqual({ played: 0, focus: 0 })
  })
})
