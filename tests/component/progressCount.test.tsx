import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressCount } from '@/components/tutorial/ProgressCount'

describe('ProgressCount', () => {
  it('sets the count done and the total apart, the total green', () => {
    render(<ProgressCount text="12 centres sur 48 en place" done={12} total={48} />)
    expect(screen.getByText('48')).toHaveClass('text-emerald-400', 'font-semibold')
    const done = screen.getByText('12')
    expect(done).toHaveClass('font-semibold')
    expect(done.getAttribute('style')).toContain('25%')
    expect(done.parentElement).toHaveTextContent('12 centres sur 48 en place')
  })

  it('tells a count done equal to its total apart, done first', () => {
    render(<ProgressCount text="48 of 48 centers in place" done={48} total={48} />)
    const [done, total] = screen.getAllByText('48')
    expect(done!.getAttribute('style')).toContain('100%')
    expect(total).toHaveClass('text-emerald-400')
  })

  it('leaves words without its numbers as they are', () => {
    render(<ProgressCount text="Parité corrigée" done={1} total={1} />)
    expect(screen.getByText('Parité corrigée').tagName).not.toBe('SPAN')
  })
})
