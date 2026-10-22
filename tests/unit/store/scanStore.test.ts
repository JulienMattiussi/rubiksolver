import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { labOf } from '@/lib/editor/scan/color'
import type { CellSample } from '@/lib/editor/scan/sample'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useScan } from '@/store/scanStore'
import { scanOf } from '../editor/scanPictures'

beforeEach(() => {
  vi.useFakeTimers()
  useCube.getState().setShape('3')
  useEditor.getState().enter()
  useScan.getState().start()
})

afterEach(() => {
  useScan.getState().close()
  vi.useRealTimers()
})

/** A face taken, and its check run. */
function take(cells: readonly CellSample[]) {
  useScan.getState().take(cells)
  vi.runAllTimers()
}

describe('scan store', () => {
  it('takes each face in turn, then paints the cube read in the editor', () => {
    const { faces, edit } = scanOf('3', 3)
    faces.forEach((cells, i) => {
      expect(useScan.getState().face).toBe(i)
      take(cells)
    })
    expect(useScan.getState()).toMatchObject({ status: 'complete', cheers: 6 })
    useScan.getState().read()
    vi.runAllTimers()
    expect(useScan.getState().open).toBe(false)
    expect(useEditor.getState().edit).toEqual(edit)
    // Asked to check it by eye, until the colors are entered otherwise.
    expect(useEditor.getState().fromScan).toBe(true)
    useEditor.getState().clearAll()
    expect(useEditor.getState().fromScan).toBe(false)
  })

  it('takes a face again when it does not show the face asked for', () => {
    const { faces } = scanOf('3', 4)
    // The red face shown first: green is asked.
    take(faces[1]!)
    expect(useScan.getState()).toMatchObject({ face: 0, missed: true, status: 'aiming' })
    take(faces[0]!)
    expect(useScan.getState()).toMatchObject({ face: 1, missed: false })
  })

  it('goes back to a face misread, once all are in', () => {
    const { faces } = scanOf('3', 5)
    faces[3]![0] = { lab: labOf(150, 40, 200) }
    faces.forEach(take)
    useScan.getState().read()
    vi.runAllTimers()
    expect(useScan.getState()).toMatchObject({ open: true, face: 3, missed: true })
  })
})
