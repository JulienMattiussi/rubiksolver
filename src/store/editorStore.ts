import { create } from 'zustand'
import { cubeShape } from '@/lib/core/cube'
import { formOf, formsOf, lookOf } from '@/lib/editor/forms'
import {
  boxCuts,
  cutsOf,
  entersCuts,
  formOfCuts,
  nextCut,
  type Cuts,
} from '@/lib/editor/cutsEditor'
import {
  buildCube,
  cubeToEdit,
  emptyEdit,
  isComplete,
  paletteColors,
  paint,
  type EditStickers,
} from '@/lib/editor/editor'
import {
  completeGears,
  gearColorsOf,
  gearsPainted,
  paintGear,
  turnedOf,
  type GearColors,
} from '@/lib/editor/gearEditor'
import { nextPiece } from '@/lib/editor/pieceEditor'
import {
  entersJoints,
  fixedJoints,
  jointsFit,
  jointsOf,
  matchesJoints,
  splitAt,
  tileMates,
  type Joint,
} from '@/lib/editor/jointsEditor'
import { barsTurned } from '@/lib/puzzles/bandaged/roadblock'
import { paintBar, turnFace } from '@/lib/editor/roadblockEditor'
import { validateCube, type ValidationError } from '@/lib/editor/validate'
import { normalOfIndex, parseVecKey } from '@/lib/core/geometry'
import { hasColoredClips, type Color, type Cube, type CubeShape, type Vec3 } from '@/lib/core/types'
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
   *  then paints its colors on it; a bandaged one whose blocks move first
   *  clicks its joints (`joints`); the Fashion-V where its halves stand
   *  (`cuts`). */
  phase: 'form' | 'joints' | 'cuts' | 'paint'
  /** A bandaged puzzle's joints entered (jointsEditor.ts). */
  joints: readonly Joint[]
  /** The step the colors were reached from (its form, its joints), which
   *  Cancel goes back to; none when entered from the current state. */
  before: 'form' | 'joints' | 'cuts' | null
  /** The Fashion-V's cells, how their halves stand (cutsEditor.ts). */
  cuts: Cuts
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
  error: ValidationError | 'gears' | 'joints' | 'jointsColors' | 'cuts' | null
  /** The solving step that found the cube impossible, when one did. */
  failedStep: string | null

  enter: () => void
  enterFromCurrent: () => void
  /** Paint on this form (a state of it), or go back to choosing one (null). */
  pickForm: (form: Cube | null) => void
  setPreview: (form: Cube | undefined) => void
  /** A bandaged puzzle's pieces fused by these joints (jointsEditor.ts). */
  join: (joints: readonly Joint[]) => void
  /** The piece at a cell taken apart, cut across an axis (a 2x2's). */
  split: (cell: Vec3, axis: number) => void
  /** The joints entered kept, if a form of the puzzle has them: on to its
   *  colors. Returns ok. */
  acceptJoints: () => boolean
  /** Back to the joints, the colors kept. */
  editJoints: () => void
  /** A cell's halves the next way round (the Fashion-V). */
  cutAt: (cellKey: string) => void
  /** On to the colors, on a state with the cuts entered, if one has them.
   *  Returns ok. */
  acceptCuts: () => boolean
  /** Back to the cuts. */
  editCuts: () => void
  /** Back to the step before (the form, the joints), or out of the editor. */
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
  joints: [],
  before: null,
  cuts: {},
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
    const first = choose
      ? 'form'
      : entersJoints(shape)
        ? 'joints'
        : entersCuts(shape)
          ? 'cuts'
          : null
    set({
      mode: 'edit',
      phase: first ?? 'paint',
      before: first,
      joints: entersJoints(shape) ? fixedJoints(shape) : [],
      cuts: entersCuts(shape) ? boxCuts() : {},
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
      before: null,
      joints: entersJoints(cubeShape(cube)) ? jointsOf(cube) : [],
      cuts: entersCuts(cubeShape(cube)) ? cutsOf(cube) : {},
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
      : set({ phase: 'form', before: 'form', preview: undefined, error: null }),

  setPreview: (preview) => set({ preview }),

  join: (joints) => set((s) => ({ joints: [...s.joints, ...joints], error: null })),

  split: (cell, axis) =>
    set((s) => ({ joints: splitAt(currentShape(), s.joints, cell, axis), error: null })),

  acceptJoints: () => {
    if (!jointsFit(currentShape(), get().joints)) {
      set({ error: 'joints' })
      return false
    }
    set({ phase: 'paint', error: null })
    return true
  },

  editJoints: () => set({ phase: 'joints', before: 'joints', error: null }),

  cutAt: (cellKey) => set((s) => ({ cuts: nextCut(s.cuts, cellKey), error: null })),

  acceptCuts: () => {
    const shape = currentShape()
    const found = formOfCuts(get().cuts)
    if (!found) {
      set({ error: 'cuts' })
      return false
    }
    // The box is no form; the colors kept while the halves stand the same.
    const form = formOf(found)
    const was = get().form
    const same = (form ? lookOf(form) : '') === (was ? lookOf(was) : '')
    set((s) => ({
      phase: 'paint',
      form,
      edit: same ? s.edit : emptyEdit(shape, form),
      selectedColor: pickable(s.selectedColor, form),
      error: null,
    }))
    return true
  },

  editCuts: () => set({ phase: 'cuts', before: 'cuts', error: null }),

  cancel: () => {
    const { phase, before } = get()
    if (phase === 'paint' && before) set({ phase: before, preview: undefined, error: null })
    else set({ mode: 'play', error: null })
  },

  setColor: (selectedColor) => set({ selectedColor }),

  paintAt: (slotKey, ni) =>
    set((s) => {
      // A RoadBlock-I's center: its whole bar.
      const shape = currentShape()
      let edit =
        shape === 'roadblock'
          ? paintBar(s.edit, slotKey, ni, s.selectedColor, s.twisted)
          : paint(s.edit, shape, slotKey, ni, s.selectedColor, s.form)
      // A bandaged puzzle's block shows one tile a face: painted whole.
      if (entersJoints(shape) && edit !== s.edit) {
        const cell = parseVecKey(slotKey)
        for (const mate of tileMates(s.joints, cell, normalOfIndex(ni))) {
          edit = paint(edit, shape, mate.join(','), ni, s.selectedColor, s.form)
        }
      }
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
    // Turned in the entry: gears over on their clips, or the slots a click
    // turned (`twisted`, empty for most puzzles).
    const turned = gears ? turnedOf(gear, edit, shape) : get().twisted
    if (!turned) {
      set({ error: 'gears' })
      return false
    }
    const cube = buildCube(edit, shape, form, turned)
    // A bandaged puzzle's pieces must stand fused as its joints were entered.
    if (entersJoints(shape) && !matchesJoints(cube, get().joints)) {
      set({ error: 'jointsColors', failedStep: null })
      return false
    }
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
