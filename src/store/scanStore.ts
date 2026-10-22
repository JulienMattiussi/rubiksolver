import { create } from 'zustand'
import { cubeShape } from '@/lib/core/cube'
import { showsFace } from '@/lib/editor/scan/capture'
import { readScan } from '@/lib/editor/scan/read'
import type { ScanReading } from '@/lib/editor/scan/classify'
import { scanPlan } from '@/lib/editor/scan/plan'
import { coreOf } from '@/lib/editor/scan/box'
import type { Picture } from '@/lib/editor/scan/outlines'
import type { CellSample } from '@/lib/editor/scan/sample'
import { useCube } from './cubeStore'
import { useEditor } from './editorStore'

/** How long a face taken is checked, shown with a loader. */
const CHECK_MS = 600
/** How long the reading's loader shows before the reading starts. */
const READ_DELAY_MS = 400

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
  /** Each face's picture as taken, to show which one to take again (a
   *  face shown by gestures is only its place in them). */
  pictures: readonly (string | undefined)[]
  /** Each face's lightness, pixel by pixel, on a puzzle read whole from
   *  its picture (outlines.ts). */
  lights: readonly (Picture | undefined)[]
  /** Faces taken so far, each one cheered (ScanView). */
  cheers: number
  /** The face taken last, not to take again before the cube turns. */
  last: readonly CellSample[] | undefined
  start: () => void
  close: () => void
  /** A face taken (capture.ts), with its picture (and its lightness, on
   *  a puzzle read whole): checked, then the next, or every face in. */
  take: (cells: readonly CellSample[], picture?: string, light?: Picture) => void
  /** Every face in: the puzzle read, painted in the editor, or the face
   *  to take again; `behind`: filmed by a camera facing the user. */
  read: (behind?: boolean) => void
}

const shape = () => cubeShape(useCube.getState().cube)

const DEBUG = 'scandebug'

/** `scandebug` anywhere in the address as the page loads (before or after
 *  its `#`, which the router then rewrites): kept for the tab's session. */
export function rememberScanDebug(): void {
  try {
    if (window.location.href.includes(DEBUG)) sessionStorage.setItem(DEBUG, '1')
  } catch {
    // No storage (a private window): the address alone says it.
  }
}

/** The scan debugged: the cells' measures written in them (ScanView), and
 *  the scan's in the console, to replay a reading that went wrong. */
export function scanDebug(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.location.href.includes(DEBUG) || sessionStorage.getItem(DEBUG) === '1'
  } catch {
    return window.location.href.includes(DEBUG)
  }
}

/** The faces taken so far, each one's cells in Lab, in the console. */
function logScan(when: string, faces: readonly (readonly CellSample[] | undefined)[]) {
  if (!scanDebug()) return
  const labs = faces.map((f) => f?.map((c) => c.lab.map((v) => Math.round(v * 10) / 10)))
  console.log(`scan ${shape()} ${when}`, JSON.stringify(labs))
}

export const useScan = create<ScanStore>((set, get) => {
  // A check still running when the scan closes is dropped.
  let run = 0
  const later = (f: () => void, ms: number) => {
    const mine = run
    setTimeout(() => mine === run && f(), ms)
  }

  const readFaces = (behind: boolean) => {
    const faces = get().faces
    logScan('read', faces)
    // A reading that fails outright is refused like any, rather than leave
    // the scan waiting for ever.
    let reading: ScanReading
    try {
      reading = readScan(shape(), faces as readonly (readonly CellSample[])[], behind, get().lights)
    } catch (error) {
      console.error(error)
      reading = { ok: false, face: 0 }
    }
    if (reading.ok) {
      useEditor.getState().scanned(reading.edit, reading.form)
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
    pictures: [],
    lights: [],
    status: 'aiming',
    missed: false,
    cheers: 0,
    last: undefined,

    start: () => {
      set({
        open: true,
        face: 0,
        faces: [],
        pictures: [],
        lights: [],
        status: 'aiming',
        missed: false,
        cheers: 0,
        last: undefined,
      })
      // A puzzle out of shape: its forms and core listed now, while the first face
      // is shown, rather than when it is read (a second or so).
      if (scanPlan(shape())[0]?.open) later(() => coreOf(shape()), 0)
    },

    close: () => {
      run++
      set({ open: false, status: 'aiming' })
    },

    take: (cells, picture, light) => {
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
        const pictures = plan.map((_, i) => (i === face ? picture : get().pictures[i]))
        const lights = plan.map((_, i) => (i === face ? light : get().lights[i]))
        logScan(`face ${face + 1}`, taken)
        const done = {
          faces: taken,
          pictures,
          lights,
          missed: false,
          cheers: get().cheers + 1,
          last: cells,
        }
        if (next >= 0) set({ ...done, face: next, status: 'aiming' })
        else set({ ...done, status: 'complete' })
      }, CHECK_MS)
    },

    read: (behind = false) => {
      set({ status: 'reading' })
      // The loader shown a moment before the reading takes the thread.
      later(() => readFaces(behind), READ_DELAY_MS)
    },
  }
})
