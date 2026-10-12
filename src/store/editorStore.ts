import { create } from 'zustand'
import { cubeShape } from '@/lib/cube'
import { formOf, formsOf } from '@/lib/forms'
import {
  buildCube,
  cubeToEdit,
  emptyEdit,
  isComplete,
  paint,
  type EditStickers,
} from '@/lib/editor'
import { validateCube, type ValidationError } from '@/lib/validate'
import type { Color, Cube, CubeShape } from '@/lib/types'
import { useCube } from './cubeStore'

/** Shape of the cube being edited (the game's cube). */
const currentShape = (): CubeShape => cubeShape(useCube.getState().cube)

interface EditorStore {
  mode: 'play' | 'edit'
  /** A shape-shifting puzzle first picks the form it stands in (`form`),
   *  then paints its colors on it. */
  phase: 'form' | 'paint'
  /** The form being entered (a state of it, see forms.ts); undefined: the box. */
  form: Cube | undefined
  /** The form hovered while choosing one, shown in 3D meanwhile. */
  preview: Cube | undefined
  selectedColor: Color
  edit: EditStickers
  /** Reason the last apply was rejected, or null. */
  error: ValidationError | null

  enter: () => void
  enterFromCurrent: () => void
  /** Paint on this form (a state of it), or go back to choosing one (null). */
  pickForm: (form: Cube | null) => void
  setPreview: (form: Cube | undefined) => void
  cancel: () => void
  setColor: (color: Color) => void
  paintAt: (slotKey: string, ni: number) => void
  clearAll: () => void
  /** Build + validate; on success load the cube into play mode. Returns ok. */
  apply: () => boolean
}

export const useEditor = create<EditorStore>((set, get) => ({
  mode: 'play',
  phase: 'paint',
  form: undefined,
  preview: undefined,
  selectedColor: 'W',
  edit: emptyEdit('3'),
  error: null,

  enter: () => {
    const shape = currentShape()
    const choose = formsOf(shape).length > 1
    set({
      mode: 'edit',
      phase: choose ? 'form' : 'paint',
      form: undefined,
      preview: undefined,
      edit: emptyEdit(shape),
      error: null,
    })
  },

  enterFromCurrent: () => {
    const cube = useCube.getState().cube
    // Out of its original form, the puzzle is entered in the one it stands in.
    const form = formOf(cube)
    set({ mode: 'edit', phase: 'paint', form, edit: cubeToEdit(cube), error: null })
  },

  pickForm: (form) =>
    form
      ? set({
          phase: 'paint',
          form,
          preview: undefined,
          edit: emptyEdit(currentShape(), form),
          error: null,
        })
      : set({ phase: 'form', preview: undefined, error: null }),

  setPreview: (preview) => set({ preview }),

  cancel: () => set({ mode: 'play', error: null }),

  setColor: (selectedColor) => set({ selectedColor }),

  paintAt: (slotKey, ni) =>
    set((s) => ({
      edit: paint(s.edit, currentShape(), slotKey, ni, s.selectedColor, s.form),
      error: null,
    })),

  clearAll: () => set((s) => ({ edit: emptyEdit(currentShape(), s.form), error: null })),

  apply: () => {
    const { edit, form } = get()
    const shape = currentShape()
    if (!isComplete(edit, shape, form)) return false
    const cube = buildCube(edit, shape, form)
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
