import { create } from 'zustand'
import { cubeShape } from '@/lib/core/cube'
import { showsFace } from '@/lib/editor/scan/capture'
import { readScan } from '@/lib/editor/scan/read'
import type { ScanReading } from '@/lib/editor/scan/classify'
import { scanPlan } from '@/lib/editor/scan/plan'
import { coreOf } from '@/lib/editor/scan/box'
import type { Picture } from '@/lib/editor/scan/outlines'
import { placeStickers, stickerSizes } from '@/lib/editor/scan/sized'
import { readSized } from '@/lib/editor/scan/sizedRead'
import { findStickers, type FaceImage } from '@/workers/findStickers'
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

/** What is kept of a face taken, besides its cells: its photo (to show it
 *  again, should it be refused), and on a puzzle read from its pictures,
 *  its lightness (outlines.ts) or its image (a mirror's, sized.ts). */
export interface Kept {
  readonly photo?: string
  readonly light?: Picture
  readonly image?: FaceImage
}

interface ScanStore {
  open: boolean
  /** The face to take (`scanPlan`'s order). */
  face: number
  /** Each face's cells once taken. */
  faces: readonly (readonly CellSample[] | undefined)[]
  status: ScanStatus
  /** The last face taken, or the puzzle read, was refused. */
  missed: boolean
  /** What is kept of each face taken: its photo shows which one to take
   *  again (a face shown by gestures is only its place in them). */
  kept: readonly (Kept | undefined)[]
  /** Faces taken so far, each one cheered (ScanView). */
  cheers: number
  /** The face taken last, not to take again before the cube turns. */
  last: readonly CellSample[] | undefined
  start: () => void
  close: () => void
  /** A face taken (capture.ts), and what is kept of it: checked, then the
   *  next, or every face in. */
  take: (cells: readonly CellSample[], kept?: Kept) => void
  /** Every face in: the puzzle read, painted in the editor, or the face
   *  to take again. */
  read: () => void
  /** Filmed by a camera facing the user (a laptop's, its picture
   *  mirrored): the gestures come mirrored, the faces named, checked and
   *  read as they come (`orderFor`). */
  behind: boolean
  setBehind: (behind: boolean) => void
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

  /** The faces as asked, the camera facing the user or not. */
  const plan = () => scanPlan(shape(), useCube.getState().variant, get().behind)

  const readFaces = () => {
    const faces = get().faces
    logScan('read', faces)
    // A reading that fails outright is refused like any, rather than leave
    // the scan waiting for ever.
    let reading: ScanReading
    try {
      const lights = get().kept.map((k) => k?.light)
      reading = readScan(shape(), faces as readonly (readonly CellSample[])[], get().behind, lights)
    } catch (error) {
      console.error(error)
      reading = { ok: false, face: 0 }
    }
    done(reading)
  }

  /** A mirror read by its stickers' sizes: each face's found in the worker
   *  (OpenCV), set round its center (the frame's middle), then read. */
  const readSizes = async () => {
    const mine = run
    let reading: ScanReading
    try {
      const sizes = []
      const found = []
      for (const kept of get().kept) {
        const image = kept?.image
        const rects = image ? await findStickers(image) : []
        const middle = image ? ([image.width / 2, image.height / 2] as const) : ([0, 0] as const)
        found.push({ size: image && [image.width, image.height], rects })
        sizes.push(stickerSizes(placeStickers(rects, middle)))
      }
      // The rectangles found, to replay a reading that went wrong.
      if (scanDebug()) console.log(`scan ${shape()} sized`, JSON.stringify(found))
      reading = readSized(sizes)
    } catch (error) {
      console.error(error)
      reading = { ok: false, face: 0 }
    }
    if (mine === run) done(reading)
  }

  /** The puzzle read: painted in the editor, or the face to take again. */
  const done = (reading: ScanReading) => {
    const faces = get().faces
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
    kept: [],
    status: 'aiming',
    missed: false,
    cheers: 0,
    last: undefined,

    start: () => {
      set({
        open: true,
        face: 0,
        faces: [],
        kept: [],
        status: 'aiming',
        missed: false,
        cheers: 0,
        last: undefined,
      })
      // A puzzle out of shape: its forms and core listed now, while the first face
      // is shown, rather than when it is read (a second or so).
      if (plan()[0]?.open) later(() => coreOf(shape()), 0)
    },

    close: () => {
      run++
      set({ open: false, status: 'aiming' })
    },

    take: (cells, kept) => {
      set({ status: 'checking' })
      later(() => {
        const asking = plan()
        const { face, faces } = get()
        const asked = asking[face]!
        if (!showsFace(cells, asked)) {
          set({ status: 'aiming', missed: true })
          return
        }
        const taken = asking.map((_, i) => (i === face ? cells : faces[i]))
        const next = taken.findIndex((f) => !f)
        const keep = asking.map((_, i) => (i === face ? kept : get().kept[i]))
        logScan(`face ${face + 1}`, taken)
        const after = {
          faces: taken,
          kept: keep,
          missed: false,
          cheers: get().cheers + 1,
          last: cells,
        }
        if (next >= 0) set({ ...after, face: next, status: 'aiming' })
        else set({ ...after, status: 'complete' })
      }, CHECK_MS)
    },

    behind: false,
    setBehind: (behind) => set({ behind }),

    read: () => {
      set({ status: 'reading' })
      // The loader shown a moment before the reading takes the thread.
      later(() => (plan()[0]?.sized ? void readSizes() : readFaces()), READ_DELAY_MS)
    },
  }
})
