import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ScanButton } from '@/components/edit/scan/ScanButton'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useScan } from '@/store/scanStore'

vi.mock('@/hooks/useCamera', () => ({
  hasCamera: () => true,
  useCamera: () => ({
    videoRef: { current: null },
    status: 'on',
    mirrored: false,
    canTorch: false,
    torch: false,
    setTorch: () => {},
  }),
}))

const t = () => useI18n.getState().t

beforeEach(() => {
  vi.useFakeTimers()
  useCube.getState().setShape('3')
})

afterEach(() => {
  act(() => useScan.getState().close())
  vi.useRealTimers()
})

describe('<ScanButton />', () => {
  it('does not start over when pressed again during a scan (the space bar)', () => {
    render(<ScanButton />)
    const button = screen.getByRole('button', { name: new RegExp(t().scanStart) })
    fireEvent.click(button)
    // Two faces in: pressed again (as the space bar does a button keeping
    // the focus), the scan goes on.
    act(() => useScan.setState({ face: 2 }))
    fireEvent.click(button)
    expect(useScan.getState().face).toBe(2)
    // Opened, the scan takes the focus off it.
    expect(document.activeElement).not.toBe(button)
  })
})
