import { create } from 'zustand'
import { cubeShape } from '@/lib/cube'
import {
  buildCube,
  cubeToEdit,
  emptyEdit,
  isComplete,
  paint,
  type EditStickers,
} from '@/lib/editor'
import { validateCube, type ValidationError } from '@/lib/validate'
import type { Color, CubeShape } from '@/lib/types'
import { useCube } from './cubeStore'

/** Size of the cube currently being edited (the game's cube). */
const currentShape = (): CubeShape => cubeShape(useCube.getState().cube)

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
  edit: emptyEdit('3'),
  error: null,

  enter: () => set({ mode: 'edit', edit: emptyEdit(currentShape()), error: null }),

  enterFromCurrent: () =>
    set({ mode: 'edit', edit: cubeToEdit(useCube.getState().cube), error: null }),

  cancel: () => set({ mode: 'play', error: null }),

  setColor: (selectedColor) => set({ selectedColor }),

  paintAt: (slotKey, ni) =>
    set((s) => ({ edit: paint(s.edit, currentShape(), slotKey, ni, s.selectedColor), error: null })),

  clearAll: () => set({ edit: emptyEdit(currentShape()), error: null }),

  apply: () => {
    const { edit } = get()
    const shape = currentShape()
    if (!isComplete(edit, shape)) return false
    const cube = buildCube(edit, shape)
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
