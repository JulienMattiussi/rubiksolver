import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SlowCog } from '@/components/solve/SlowCog'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('<SlowCog />', () => {
  it('shows only once computing has lasted four seconds, and hides when it ends', () => {
    const { container, rerender } = render(<SlowCog computing />)
    const cog = () => container.firstElementChild!
    expect(cog()).toHaveClass('opacity-0')
    act(() => vi.advanceTimersByTime(3900))
    expect(cog()).toHaveClass('opacity-0')
    act(() => vi.advanceTimersByTime(100))
    expect(cog()).toHaveClass('opacity-100')
    rerender(<SlowCog computing={false} />)
    expect(cog()).toHaveClass('opacity-0')
  })
})
