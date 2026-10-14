import { create } from 'zustand'
import { cubeShape } from '@/lib/cube'
import { formOf, formsOf } from '@/lib/forms'
import {
  buildCube,
  cubeToEdit,
  emptyEdit,
  isComplete,
  paletteColors,
  paint,
  type EditStickers,
} from '@/lib/editor'
import {
  completeGears,
  gearColorsOf,
  gearsPainted,
  paintGear,
  turnedOf,
  type GearColors,
} from '@/lib/gearEditor'
import { nextPiece } from '@/lib/pieceEditor'
import { barsTurned } from '@/lib/roadblock'
import { paintBar, turnFace } from '@/lib/roadblockEditor'
import { validateCube, type ValidationError } from '@/lib/validate'
import { hasColoredClips, type Color, type Cube, type CubeShape } from '@/lib/types'
import { useCube } from './cubeStore'

/** Shape of the cube being edited (the game's cube). */
const currentShape = (): CubeShape => cubeShape(useCube.getState().cube)

/** The color picked, kept if the palette has it, else its first. */
const pickable = (selected: Color, form?: Cube): Color => {
  const colors = paletteColors(currentShape(), form)
  return colors.includes(selected) ? selected : (colors[0] ?? selected)
}

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
  /** A Gear Cube's gears, painted apart from their clips (gearEditor.ts). */
  gear: GearColors
  /** A Z-Twist's side centers a quarter turn off, by slot (twist.ts); a
   *  RoadBlock-I's faces whose bars lie a quarter off, by their middle's slot. */
  twisted: readonly string[]
  /** Reason the last apply was rejected (`gears`: a gear not its clips'
   *  colors), or null. */
  error: ValidationError | 'gears' | null
  /** The solving step that found the cube impossible, when one did. */
  failedStep: string | null

  enter: () => void
  enterFromCurrent: () => void
  /** Paint on this form (a state of it), or go back to choosing one (null). */
  pickForm: (form: Cube | null) => void
  setPreview: (form: Cube | undefined) => void
  cancel: () => void
  setColor: (color: Color) => void
  paintAt: (slotKey: string, ni: number) => void
  /** Paint a face of a Gear Cube's gear (see gearEditor.ts). */
  paintGearAt: (slotKey: string, ni: number) => void
  /** Turn a Z-Twist side center a quarter, or back. */
  twistAt: (slotKey: string) => void
  /** A RoadBlock-I's face's bars turned the other way, their colors with them. */
  turnBarsAt: (faceKey: string) => void
  /** Put the next piece that fits in a slot (a puzzle entered piece by
   *  piece, see pieceEditor.ts). */
  cycleAt: (slotKey: string) => void
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
  gear: {},
  twisted: [],
  error: null,
  failedStep: null,

  enter: () => {
    const shape = currentShape()
    const choose = formsOf(shape).length > 1
    set({
      mode: 'edit',
      phase: choose ? 'form' : 'paint',
      form: undefined,
      preview: undefined,
      edit: emptyEdit(shape),
      gear: {},
      twisted: [],
      selectedColor: pickable(get().selectedColor),
      error: null,
    })
  },

  enterFromCurrent: () => {
    const cube = useCube.getState().cube
    // Out of its original form, the puzzle is entered in the one it stands in.
    const form = formOf(cube)
    set({
      mode: 'edit',
      phase: 'paint',
      form,
      edit: cubeToEdit(cube),
      gear: gearColorsOf(cube),
      twisted:
        cubeShape(cube) === 'roadblock'
          ? barsTurned(cube)
          : cube
              .filter((c) => c.spin === 1 && c.stickers.length === 1)
              .map((c) => c.position.join(',')),
      selectedColor: pickable(get().selectedColor, form),
      error: null,
    })
  },

  pickForm: (form) =>
    form
      ? set({
          phase: 'paint',
          form,
          preview: undefined,
          edit: emptyEdit(currentShape(), form),
          gear: {},
          twisted: [],
          selectedColor: pickable(get().selectedColor, form),
          error: null,
        })
      : set({ phase: 'form', preview: undefined, error: null }),

  setPreview: (preview) => set({ preview }),

  cancel: () => set({ mode: 'play', error: null }),

  setColor: (selectedColor) => set({ selectedColor }),

  paintAt: (slotKey, ni) =>
    set((s) => {
      // A RoadBlock-I's center: its whole bar.
      const edit =
        currentShape() === 'roadblock'
          ? paintBar(s.edit, slotKey, ni, s.selectedColor, s.twisted)
          : paint(s.edit, currentShape(), slotKey, ni, s.selectedColor, s.form)
      return {
        edit,
        gear: hasColoredClips(currentShape())
          ? completeGears(s.gear, edit, currentShape())
          : s.gear,
        error: null,
      }
    }),

  twistAt: (slotKey) =>
    set((s) => ({
      twisted: s.twisted.includes(slotKey)
        ? s.twisted.filter((k) => k !== slotKey)
        : [...s.twisted, slotKey],
      error: null,
    })),

  turnBarsAt: (faceKey) =>
    set((s) => ({
      twisted: s.twisted.includes(faceKey)
        ? s.twisted.filter((k) => k !== faceKey)
        : [...s.twisted, faceKey],
      edit: turnFace(s.edit, faceKey, s.twisted.includes(faceKey)),
      error: null,
    })),

  paintGearAt: (slotKey, ni) =>
    set((s) => ({
      gear: paintGear(s.gear, s.edit, currentShape(), slotKey, ni, s.selectedColor),
      error: null,
    })),

  cycleAt: (slotKey) =>
    set((s) => ({ edit: nextPiece(s.edit, currentShape(), slotKey), error: null })),

  clearAll: () =>
    set((s) => ({ edit: emptyEdit(currentShape(), s.form), gear: {}, twisted: [], error: null })),

  apply: () => {
    const { edit, form, gear } = get()
    const shape = currentShape()
    if (!isComplete(edit, shape, form)) return false
    const gears = hasColoredClips(shape)
    if (gears && gearsPainted(gear, shape).painted < gearsPainted(gear, shape).total) return false
    const turned = gears
      ? turnedOf(gear, edit, shape)
      : shape === 'twist' || shape === 'quarter' || shape === 'roadblock'
        ? get().twisted
        : []
    if (!turned) {
      set({ error: 'gears' })
      return false
    }
    const cube = buildCube(edit, shape, form, turned)
    const result = validateCube(cube)
    if (!result.ok) {
      set({ error: result.error, failedStep: result.step ?? null })
      return false
    }
    useCube.getState().loadCube(cube)
    set({ mode: 'play', error: null })
    return true
  },
}))
