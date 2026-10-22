import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { labOf } from '@/lib/editor/scan/color'
import type { CellSample } from '@/lib/editor/scan/sample'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useScan } from '@/store/scanStore'
import { boxScanOf, scanOf } from '../editor/scanPictures'
import { solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { scrambleTurns } from '@/lib/core/moves'
import { AXIS_ROTATIONS } from '@/lib/core/geometry'
import { lookOf } from '@/lib/editor/modes/form'
import { cubeToEdit } from '@/lib/editor/edit'
import { scanPlan } from '@/lib/editor/scan/plan'
import { ghostScan } from '@/lib/puzzles/flat/ghostScan'
import { ghostPicture } from '../editor/ghostPictures'
import { seededRng } from '../../helpers'

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

  it('keeps each face picture, to show the one to take again', () => {
    const { faces } = scanOf('3', 5)
    faces[3]![0] = { lab: labOf(150, 40, 200) }
    faces.forEach((cells, i) => {
      useScan.getState().take(cells, `face ${i}`)
      vi.runAllTimers()
    })
    useScan.getState().read()
    vi.runAllTimers()
    expect(useScan.getState()).toMatchObject({ face: 3, missed: true })
    expect(useScan.getState().pictures[3]).toBe('face 3')
  })

  it('opens the paint in the form it found a tower in, no form to pick', () => {
    useCube.getState().setShape('224')
    useEditor.getState().enter()
    expect(useEditor.getState().phase).toBe('form')
    useScan.getState().start()
    const rng = seededRng(5)
    const solved = solvedCube('224')
    const state = applyMoves(solved, scrambleTurns('224', 25, rng, solved))
    const held = AXIS_ROTATIONS.map((turn) =>
      state.map((c) => ({
        ...c,
        position: turn(c.position),
        stickers: c.stickers.map((st) => ({ ...st, normal: turn(st.normal) })),
      })),
    ).find((c) => new Set(c.map((p) => p.position[1])).size === 4)!
    boxScanOf('224', held, 5).forEach(take)
    useScan.getState().read()
    vi.runAllTimers()
    expect(useEditor.getState()).toMatchObject({ phase: 'paint', fromScan: true })
    expect(lookOf(useEditor.getState().form!)).toBe(lookOf(held))
  })

  it('reads a Floppy Ghost from its one picture, into the editor', () => {
    useCube.getState().setShape('ghost')
    useEditor.getState().enter()
    useScan.getState().start()
    const cube = ghostScan.states()[777]!
    const cells = scanPlan('ghost')[0]!.cells.map(() => ({ lab: labOf(200, 200, 200) }))
    useScan.getState().take(cells, 'photo', ghostPicture(cube, { turn: 2 }, seededRng(3)))
    vi.runAllTimers()
    expect(useScan.getState().status).toBe('complete')
    useScan.getState().read(true)
    vi.runAllTimers()
    expect(useEditor.getState()).toMatchObject({ edit: cubeToEdit(cube), fromScan: true })
  })
})
