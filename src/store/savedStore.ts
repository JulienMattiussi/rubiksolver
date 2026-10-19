import { create } from 'zustand'
import { cubeShape } from '@/lib/core/cube'
import { decodeCube, encodeCube } from '@/lib/app/snapshot'
import { readStored, writeStored } from '@/lib/app/storage'
import type { Cube } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'
import { useCube } from './cubeStore'

/** A memorized cube state: its text form and when it was taken. */
interface SavedState {
  readonly cube: string
  readonly savedAt: number
}

type SavedByShape = Partial<Record<CubeShape, SavedState>>

const STORAGE_KEY = 'rubiksolver.saved'

/** Saved states from a previous visit: any object (an entry that no
 *  longer decodes is dropped on restore). */
const isSaved = (value: unknown): value is SavedByShape =>
  typeof value === 'object' && value !== null

interface SavedStore {
  /** One memorized state per shape (the mirror skin shares its shape's). */
  saved: SavedByShape
  /** Memorize a cube, replacing the state memorized for its shape. */
  save: (cube: Cube) => void
  /** Load the state memorized for `shape` into the cube. An entry that no
   *  longer decodes is dropped instead. */
  restore: (shape: CubeShape) => void
}

export const useSaved = create<SavedStore>((set, get) => ({
  saved: readStored(STORAGE_KEY, isSaved, {}),

  save: (cube) => {
    const saved = {
      ...get().saved,
      [cubeShape(cube)]: { cube: encodeCube(cube), savedAt: Date.now() },
    }
    writeStored(STORAGE_KEY, saved)
    set({ saved })
  },

  restore: (shape) => {
    const entry = get().saved[shape]
    if (!entry) return
    const cube = typeof entry.cube === 'string' ? decodeCube(entry.cube) : null
    if (cube && cubeShape(cube) === shape) {
      useCube.getState().loadCube(cube)
      return
    }
    const saved = { ...get().saved }
    delete saved[shape]
    writeStored(STORAGE_KEY, saved)
    set({ saved })
  },
}))
