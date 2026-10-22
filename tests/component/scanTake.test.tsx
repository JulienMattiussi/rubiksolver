import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ScanTake } from '@/components/edit/scan/ScanTake'
import { useI18n } from '@/i18n/i18nStore'

const t = () => useI18n.getState().t

describe('<ScanTake />', () => {
  it('takes the face once tapped, or the space bar released', () => {
    const onArm = vi.fn()
    render(<ScanTake armed={false} nothing={false} onArm={onArm} />)
    fireEvent.click(screen.getByRole('button', { name: t().scanTake }))
    fireEvent.keyDown(window, { code: 'Space' })
    expect(onArm).toHaveBeenCalledTimes(1)
    fireEvent.keyUp(window, { code: 'Space' })
    expect(onArm).toHaveBeenCalledTimes(2)
  })

  it('says to hold still once tapped, and when nothing held still', () => {
    const { rerender } = render(<ScanTake armed nothing={false} onArm={() => {}} />)
    expect(screen.getByRole('status').textContent).toBe(t().scanHolding)
    expect(screen.queryByRole('button')).toBeNull()
    rerender(<ScanTake armed={false} nothing onArm={() => {}} />)
    expect(screen.getByText(t().scanNothing)).toBeTruthy()
  })
})
