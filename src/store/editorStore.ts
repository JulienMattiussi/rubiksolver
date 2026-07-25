import { create } from 'zustand'
import {
  buildCube,
  cubeToEdit,
  emptyEdit,
  isComplete,
  paint,
  type EditStickers,
} from '@/lib/editor'
import { validateCube, type ValidationError } from '@/lib/validate'
import type { Color } from '@/lib/types'
import { useCube } from './cubeStore'

interface EditorStore {
  mode: 'play' | 'edit'
  selectedColor: Color
  edit: EditStickers
  /** Reason the last apply was rejected, or null. */
  error: ValidationError | null

  enter: () => void
  enterFromCurrent: () => void
  cancel: () => void
  setColor: (color: Color) => void
  paintAt: (slotKey: string, ni: number) => void
  clearAll: () => void
  /** Build + validate; on success load the cube into play mode. Returns ok. */
  apply: () => boolean
}

export const useEditor = create<EditorStore>((set, get) => ({
  mode: 'play',
  selectedColor: 'W',
  edit: emptyEdit(),
  error: null,

  enter: () => set({ mode: 'edit', edit: emptyEdit(), error: null }),

  enterFromCurrent: () =>
    set({ mode: 'edit', edit: cubeToEdit(useCube.getState().cube), error: null }),

  cancel: () => set({ mode: 'play', error: null }),

  setColor: (selectedColor) => set({ selectedColor }),

  paintAt: (slotKey, ni) =>
    set((s) => ({ edit: paint(s.edit, slotKey, ni, s.selectedColor), error: null })),

  clearAll: () => set({ edit: emptyEdit(), error: null }),

  apply: () => {
    const { edit } = get()
    if (!isComplete(edit)) return false
    const cube = buildCube(edit)
    const result = validateCube(cube)
    if (!result.ok) {
      set({ error: result.error })
      return false
    }
    useCube.getState().loadCube(cube)
    set({ mode: 'play', error: null })
    return true
  },
}))
