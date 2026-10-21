import { create } from 'zustand'
import { cubeShape } from '@/lib/core/cube'
import { showsFace } from '@/lib/editor/scan/capture'
import { readScan } from '@/lib/editor/scan/classify'
import { scanPlan } from '@/lib/editor/scan/plan'
import type { CellSample } from '@/lib/editor/scan/sample'
import { useCube } from './cubeStore'
import { useEditor } from './editorStore'

/** How long a face taken is checked, shown with a loader. */
const CHECK_MS = 600

/** Aiming at a face, checking the one taken, every face in (cheered,
 *  then read), or reading the whole puzzle. */
type ScanStatus = 'aiming' | 'checking' | 'complete' | 'reading'

interface ScanStore {
  open: boolean
  /** The face to take (`scanPlan`'s order). */
  face: number
  /** Each face's cells once taken. */
  faces: readonly (readonly CellSample[] | undefined)[]
  status: ScanStatus
  /** The last face taken, or the puzzle read, was refused. */
  missed: boolean
  /** Faces taken so far, each one cheered (ScanView). */
  cheers: number
  /** The face taken last, not to take again before the cube turns. */
  last: readonly CellSample[] | undefined
  start: () => void
  close: () => void
  /** A face taken (capture.ts): checked, then the next, or every face in. */
  take: (cells: readonly CellSample[]) => void
  /** Every face in: the puzzle read, painted in the editor, or the face
   *  to take again. */
  read: () => void
}

const shape = () => cubeShape(useCube.getState().cube)

export const useScan = create<ScanStore>((set, get) => {
  // A check still running when the scan closes is dropped.
  let run = 0
  const later = (f: () => void, ms: number) => {
    const mine = run
    setTimeout(() => mine === run && f(), ms)
  }

  const readFaces = () => {
    const faces = get().faces
    const reading = readScan(shape(), faces as readonly (readonly CellSample[])[])
    if (reading.ok) {
      useEditor.getState().scanned(reading.edit)
      get().close()
      return
    }
    set({
      faces: faces.map((f, i) => (i === reading.face ? undefined : f)),
      face: reading.face,
      status: 'aiming',
      missed: true,
    })
  }

  return {
    open: false,
    face: 0,
    faces: [],
    status: 'aiming',
    missed: false,
    cheers: 0,
    last: undefined,

    start: () =>
      set({
        open: true,
        face: 0,
        faces: [],
        status: 'aiming',
        missed: false,
        cheers: 0,
        last: undefined,
      }),

    close: () => {
      run++
      set({ open: false, status: 'aiming' })
    },

    take: (cells) => {
      set({ status: 'checking' })
      later(() => {
        const plan = scanPlan(shape())
        const { face, faces } = get()
        const asked = plan[face]!
        if (!showsFace(cells, asked)) {
          set({ status: 'aiming', missed: true })
          return
        }
        const taken = plan.map((_, i) => (i === face ? cells : faces[i]))
        const next = taken.findIndex((f) => !f)
        const done = { faces: taken, missed: false, cheers: get().cheers + 1, last: cells }
        if (next >= 0) set({ ...done, face: next, status: 'aiming' })
        else set({ ...done, status: 'complete' })
      }, CHECK_MS)
    },

    read: () => {
      set({ status: 'reading' })
      // Let the loader show before the reading takes the thread.
      later(readFaces, 50)
    },
  }
})
