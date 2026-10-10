import { create } from 'zustand'
import { cubeShape } from '@/lib/cube'
import { decodeCube, encodeCube } from '@/lib/snapshot'
import type { Cube, CubeShape } from '@/lib/types'
import { useCube } from './cubeStore'

/** A memorized cube state: its text form and when it was taken. */
interface SavedState {
  readonly cube: string
  readonly savedAt: number
}

type SavedByShape = Partial<Record<CubeShape, SavedState>>

const STORAGE_KEY = 'rubiksolver.saved'

/** Saved states from a previous visit. Storage may be missing, blocked or
 *  hold anything, so every failure just means "nothing saved". */
function readStorage(): SavedByShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as SavedByShape) : {}
  } catch {
    return {}
  }
}

function writeStorage(saved: SavedByShape): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Storage unavailable: the state still lives for this session.
  }
}

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
  saved: readStorage(),

  save: (cube) => {
    const saved = {
      ...get().saved,
      [cubeShape(cube)]: { cube: encodeCube(cube), savedAt: Date.now() },
    }
    writeStorage(saved)
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
    writeStorage(saved)
    set({ saved })
  },
}))
