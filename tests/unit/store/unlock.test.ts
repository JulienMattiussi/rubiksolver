import { beforeEach, describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { useCube } from '@/store/cubeStore'

const FLOPPY = solvedCube('331')

beforeEach(() => {
  useCube.getState().setShape('3')
  useCube.getState().setShape('331')
})

describe('cube store: the unlocked mode', () => {
  it('starts off, and goes off on another puzzle', () => {
    expect(useCube.getState().unlocked).toBe(false)
    useCube.getState().setUnlocked(true)
    expect(useCube.getState().unlocked).toBe(true)
    useCube.getState().setShape('3')
    expect(useCube.getState().unlocked).toBe(false)
  })

  it('goes back off only once reset', () => {
    useCube.getState().setUnlocked(true)
    useCube.getState().loadCube(applyMoves(FLOPPY, parseMoves('R2')))
    useCube.getState().setUnlocked(false)
    expect(useCube.getState().unlocked).toBe(true)
    useCube.getState().reset()
    useCube.getState().setUnlocked(false)
    expect(useCube.getState().unlocked).toBe(false)
  })

  it('turns on by itself for a state loaded out of shape', () => {
    useCube.getState().loadCube(applyMoves(FLOPPY, parseMoves('R')))
    expect(useCube.getState().unlocked).toBe(true)
  })

  it('scrambles with quarter turns once on', () => {
    useCube.getState().setUnlocked(true)
    useCube.getState().scramble()
    expect(useCube.getState().queue.some((m) => 'amount' in m && m.amount !== 2)).toBe(true)
  })

  it('solves with its own method once on, the locked one back once off', () => {
    useCube.getState().setUnlocked(true)
    expect(useCube.getState().method).toBe('floppyFlatFirst')
    const cube = applyMoves(FLOPPY, parseMoves("R F' L2 B"))
    useCube.getState().loadCube(cube)
    const moves = useCube
      .getState()
      .prepareSolution()
      .flatMap((s) => [...s.moves])
    expect(isSolved(applyMoves(cube, moves))).toBe(true)
    useCube.getState().reset()
    useCube.getState().setUnlocked(false)
    expect(useCube.getState().method).toBe('floppyEdgesFirst')
  })
})
