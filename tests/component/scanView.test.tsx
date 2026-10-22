import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ScanView } from '@/components/edit/scan/ScanView'
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
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

beforeEach(() => {
  vi.useFakeTimers()
  useCube.getState().setShape('224')
  useScan.getState().start()
})

afterEach(() => {
  useScan.getState().close()
  vi.useRealTimers()
})

describe('<ScanView />', () => {
  it('reads once every face is in, then asks again the last one refused', () => {
    // The reading refuses the last face, the one just taken.
    const read = vi.fn(() => useScan.setState({ status: 'aiming', face: 5, missed: true }))
    useScan.setState({ read })
    render(<ScanView />)
    wait(3000)
    act(() => useScan.setState({ status: 'complete', cheers: 6, face: 5 }))
    wait(3000)
    expect(read).toHaveBeenCalledTimes(1)
    // Its instruction back, and the button to take it.
    wait(3000)
    expect(screen.getByText(t().scanMissed)).toBeTruthy()
    expect(screen.getByRole('button', { name: t().scanTake })).toBeTruthy()
    // No gesture to it: the face is taken again where it stands.
    expect(screen.queryByText(t().scanMovesAny.flip)).toBeNull()
  })
})
