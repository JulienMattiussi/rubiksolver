import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Select } from '@/components/ui/Select'

const OPTIONS = [
  { value: 'a', label: 'Par couches', badge: { icon: <svg />, title: 'Tutoriel disponible' } },
  { value: 'b', label: 'Roux' },
  { value: 'c', label: 'Optimale' },
]

function Harness() {
  const [value, setValue] = useState('a')
  return (
    <>
      <Select id="m" label="Méthode" value={value} options={OPTIONS} onChange={setValue} />
      <output>{value}</output>
    </>
  )
}

describe('Select', () => {
  it('opens a list whose options say their badge, and chooses by click', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const box = screen.getByRole('combobox', { name: 'Méthode' })
    expect(box).toHaveAttribute('aria-expanded', 'false')
    await user.click(box)
    expect(
      screen.getByRole('option', { name: 'Par couches, Tutoriel disponible' }),
    ).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('option', { name: 'Roux' }))
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('b')
  })

  it('moves and chooses with the keyboard, Escape closing it unchanged', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    screen.getByRole('combobox').focus()
    await user.keyboard('{ArrowDown}{End}{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('c')
    await user.keyboard('{ArrowDown}{Home}{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('c')
  })
})
