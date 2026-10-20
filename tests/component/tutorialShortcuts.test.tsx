import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useTutorialShortcuts, type TutorialKeys } from '@/hooks/useTutorialShortcuts'

function Harness({ keys }: { keys: TutorialKeys }) {
  useTutorialShortcuts(keys)
  return <input aria-label="field" />
}

describe('useTutorialShortcuts', () => {
  it('presses on with Space or the right arrow, back with the left arrow or Backspace', async () => {
    const user = userEvent.setup()
    const ahead = vi.fn()
    const back = vi.fn()
    render(<Harness keys={{ ahead, back }} />)
    await user.keyboard(' {ArrowRight}')
    expect(ahead).toHaveBeenCalledTimes(2)
    await user.keyboard('{ArrowLeft}{Backspace}')
    expect(back).toHaveBeenCalledTimes(2)
  })

  it('leaves the keys to a field being typed in, and does nothing where a button is off', async () => {
    const user = userEvent.setup()
    const ahead = vi.fn()
    const { getByLabelText } = render(<Harness keys={{ ahead }} />)
    await user.keyboard('{Backspace}')
    await user.click(getByLabelText('field'))
    await user.keyboard(' ')
    expect(ahead).not.toHaveBeenCalled()
  })
})
