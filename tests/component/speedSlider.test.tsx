import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpeedSlider } from '@/components/controls/SpeedSlider'
import { MAX_TURN_DURATION } from '@/lib/app/speed'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'

beforeEach(() => useI18n.getState().setLocale('fr'))

describe('SpeedSlider', () => {
  it('says on hover how long a move takes', () => {
    useCube.getState().setTurnDuration(0.3)
    render(<SpeedSlider />)
    expect(screen.getByRole('slider')).toHaveAttribute('title', '300 ms par coup')
  })

  it('counts the pause after a move, at the slowest', () => {
    useCube.getState().setTurnDuration(MAX_TURN_DURATION)
    render(<SpeedSlider />)
    expect(screen.getByRole('slider')).toHaveAttribute('title', '5 s par coup')
  })
})
