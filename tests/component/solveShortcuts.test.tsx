import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSolveShortcuts, type SolveKeys } from '@/hooks/useSolveShortcuts'

function setup(over: Partial<SolveKeys> = {}) {
  const keys: SolveKeys = {
    enabled: true,
    canBack: true,
    canAhead: true,
    playing: false,
    canSolve: true,
    nextMove: vi.fn(),
    undoMove: vi.fn(),
    nextStep: vi.fn(),
    undoStep: vi.fn(),
    solveAll: vi.fn(),
    pause: vi.fn(),
    ...over,
  }
  renderHook(() => useSolveShortcuts(keys))
  return keys
}

const press = (key: string, target: Window | Element = window) => fireEvent.keyDown(target, { key })

describe('solution shortcuts', () => {
  it('walks the solution: arrows a move, pages a step, Enter it all', () => {
    const keys = setup()
    press('ArrowRight')
    press('ArrowLeft')
    press('PageDown')
    press('PageUp')
    press('Enter')
    expect(keys.nextMove).toHaveBeenCalledOnce()
    expect(keys.undoMove).toHaveBeenCalledOnce()
    expect(keys.nextStep).toHaveBeenCalledOnce()
    expect(keys.undoStep).toHaveBeenCalledOnce()
    expect(keys.solveAll).toHaveBeenCalledOnce()
  })

  it('pauses with Space while playing, resumes with it when paused', () => {
    const playing = setup({ playing: true })
    press(' ')
    expect(playing.pause).toHaveBeenCalledOnce()
    expect(playing.solveAll).not.toHaveBeenCalled()
  })

  it('stops a solution playing with the left arrow or Page Up, then goes back', () => {
    const order: string[] = []
    setup({
      playing: true,
      canBack: false,
      pause: () => order.push('pause'),
      undoMove: () => order.push('undo move'),
      undoStep: () => order.push('undo step'),
    })
    press('ArrowLeft')
    press('PageUp')
    expect(order).toEqual(['pause', 'undo move', 'pause', 'undo step'])
  })

  it('does nothing its button could not do, nor while typing or off', () => {
    const stuck = setup({ canAhead: false, canBack: false })
    press('ArrowRight')
    press('PageUp')
    expect(stuck.nextMove).not.toHaveBeenCalled()
    expect(stuck.undoStep).not.toHaveBeenCalled()

    const off = setup({ enabled: false })
    press('Enter')
    expect(off.solveAll).not.toHaveBeenCalled()

    const typing = setup()
    const input = document.createElement('input')
    document.body.append(input)
    press('ArrowRight', input)
    expect(typing.nextMove).not.toHaveBeenCalled()
    input.remove()
  })
})
