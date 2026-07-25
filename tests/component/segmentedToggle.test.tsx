import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'

const options = [
  { value: 'a', label: 'A', title: 'Option A' },
  { value: 'b', label: 'B' },
] as const

describe('<SegmentedToggle />', () => {
  it('marks the active option as pressed', () => {
    render(<SegmentedToggle ariaLabel="Test" value="a" onChange={() => {}} options={options} />)
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the clicked value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedToggle ariaLabel="Test" value="a" onChange={onChange} options={options} />)
    await user.click(screen.getByRole('button', { name: 'B' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('exposes option titles as tooltips', () => {
    render(<SegmentedToggle ariaLabel="Test" value="a" onChange={() => {}} options={options} />)
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('title', 'Option A')
  })
})
