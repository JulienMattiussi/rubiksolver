import { create } from 'zustand'
import { cubeShape } from '@/lib/core/cube'
import { formOf, lookOf } from '@/lib/editor/modes/form'
import { buildCube, cubeToEdit, emptyEdit, isComplete, MarksRefused } from '@/lib/editor/edit'
import { paint, paletteColors } from '@/lib/editor/modes/colors'
import {
  entryOf,
  firstStepOf,
  stepOf,
  togglesAt,
  type EditStickers,
  type StepKind,
} from '@/lib/editor/entry'
import { nextPiece } from '@/lib/editor/modes/pieces'
import { jointsFit, jointsOf, matchesJoints, paintTile, splitAt } from '@/lib/editor/modes/joints'
import { nextToggle } from '@/lib/editor/modes/toggles'
import { nextStep, partsDone, settingsOf, startSettings, type Settings } from '@/lib/editor/steps'
import {
  CANVAS_COUNT,
  editOfCanvases,
  paintCanvas,
  regionsOf,
  showsCanvases,
  toggleJoin,
  viewsOfCanvases,
  type FaceCell,
} from '@/lib/editor/modes/canvas'
import { tablesFor } from '@/lib/editor/editorTables'
import { findFaces } from '@/workers/findFaces'
import { validateCube, type ValidationError } from '@/lib/editor/validate'
import type { Color, Cube, Vec3 } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'
import { useCube } from './cubeStore'

/** Shape of the cube being edited (the game's cube). */
const currentShape = (): CubeShape => cubeShape(useCube.getState().cube)

/** The color picked, kept if the palette has it, else its first. */
const pickable = (selected: Color, form?: Cube): Color => {
  const colors = paletteColors(currentShape(), form)
  return colors.includes(selected) ? selected : (colors[0] ?? selected)
}

/** Why a step or the entry is refused, besides the state's validation. */
type EntryError = 'parts' | 'joints' | 'jointsColors' | 'cuts' | 'faces' | 'facesShape'

interface EditorStore extends Settings {
  mode: 'play' | 'edit'
  /** The step being entered (lib/editor/entry.ts: the model's steps, then
   *  the paint). */
  phase: StepKind | 'paint'
  /** On canvases: the face being entered (`faceAt`), what a click paints
   *  there (`faceColor`), and whether its state is being searched. */
  faceAt: number
  faceColor: FaceCell
  finding: boolean
  /** The form being entered (a state of it, see modes/form.ts); undefined: the box. */
  form: Cube | undefined
  /** The form hovered while choosing one, shown in 3D meanwhile. */
  preview: Cube | undefined
  selectedColor: Color
  edit: EditStickers
  /** Reason the last step or apply was refused, or null. */
  error: ValidationError | EntryError | null
  /** The solving step that found the cube impossible, when one did. */
  failedStep: string | null

  enter: () => void
  enterFromCurrent: () => void
  /** Back to a step from the paint ("Change..."), its colors kept while it
   *  stays the same. */
  backTo: (step: StepKind) => void
  /** Paint on this form (a state of it). */
  pickForm: (form: Cube) => void
  setPreview: (form: Cube | undefined) => void
  /** Pieces fused by these joints (modes/joints.ts). */
  join: (joints: readonly string[]) => void
  /** The piece at a cell taken apart, cut across an axis (a 2x2's). */
  split: (cell: Vec3, axis: number) => void
  /** A cell's halves the next way round (modes/cuts.ts). */
  cutAt: (cellKey: string) => void
  /** A cell of the face being entered painted (`faceColor`). */
  faceCellAt: (cell: number) => void
  /** A joint of the face being entered clicked: two cells joined, or apart. */
  faceJoinAt: (a: number, b: number) => void
  setFaceColor: (cell: FaceCell) => void
  /** The puzzle tilted toward us (1: the next face, once this one holds;
   *  past the last, its state searched, then on to the next step) or back
   *  (-1). */
  tiltFace: (step: 1 | -1) => void
  /** A slot clicked round (modes/toggles.ts), its mates with it. */
  toggleAt: (slotKey: string) => void
  /** The step kept, if the puzzle can stand so (the joints of one of its
   *  forms, halves a state has): on to the next. Returns ok. */
  acceptStep: () => boolean
  /** Out of the editor, nothing applied, whatever the step. */
  cancel: () => void
  setColor: (color: Color) => void
  paintAt: (slotKey: string, ni: number) => void
  /** A face of a part painted apart (a Gear Cube's gear). */
  paintPartAt: (slotKey: string, ni: number) => void
  /** Put the next piece that fits in a slot (modes/pieces.ts). */
  cycleAt: (slotKey: string) => void
  clearAll: () => void
  /** The colors a camera scan read (lib/editor/scan/), to check and apply,
   *  in the form it found a puzzle that changes shape in (no form to pick). */
  scanned: (edit: EditStickers, form?: Cube) => void
  /** The colors entered come from a scan, not yet checked by eye (the
   *  panel asks to). */
  fromScan: boolean
  /** Build + validate; on success load the cube into play mode. Returns ok. */
  apply: () => boolean
}

export const useEditor = create<EditorStore>((set, get) => {
  /** On to the step after the current one, on this form: its colors kept
   *  while the form stays the same. */
  const onwards = (form: Cube | undefined, extra: Partial<EditorStore> = {}) => {
    const shape = currentShape()
    const { phase, form: was } = get()
    const same = (form ? lookOf(form) : '') === (was ? lookOf(was) : '')
    set((s) => ({
      phase: phase === 'paint' ? 'paint' : nextStep(shape, phase),
      form,
      preview: undefined,
      ...(!same && { edit: emptyEdit(shape, form), parts: {} }),
      selectedColor: pickable(s.selectedColor, form),
      error: null,
      ...extra,
    }))
  }

  return {
    mode: 'play',
    phase: 'paint',
    ...startSettings('3'),
    faceAt: 0,
    faceColor: 'W',
    finding: false,
    form: undefined,
    preview: undefined,
    selectedColor: 'W',
    edit: emptyEdit('3'),
    error: null,
    failedStep: null,
    fromScan: false,

    enter: () => {
      const shape = currentShape()
      set({
        mode: 'edit',
        phase: firstStepOf(shape),
        faceAt: 0,
        finding: false,
        ...startSettings(shape),
        form: undefined,
        preview: undefined,
        edit: emptyEdit(shape),
        selectedColor: pickable(get().selectedColor),
        error: null,
        fromScan: false,
      })
    },

    enterFromCurrent: () => {
      const cube = useCube.getState().cube
      // Out of its original form, the puzzle is entered in the one it stands in.
      const form = formOf(cube)
      set({
        mode: 'edit',
        phase: 'paint',
        ...settingsOf(cube),
        form,
        edit: cubeToEdit(cube),
        selectedColor: pickable(get().selectedColor, form),
        error: null,
        fromScan: false,
      })
    },

    backTo: (step) => set({ phase: step, faceAt: 0, preview: undefined, error: null }),

    pickForm: (form) => onwards(form),

    setPreview: (preview) => set({ preview }),

    join: (joints) => set((s) => ({ joints: [...s.joints, ...joints], error: null })),

    split: (cell, axis) =>
      set((s) => ({ joints: splitAt(currentShape(), s.joints, cell, axis), error: null })),

    cutAt: (cellKey) =>
      set((s) => ({
        cuts: stepOf(currentShape(), 'cuts')!.cuts.next(s.cuts, cellKey),
        error: null,
      })),

    faceCellAt: (cell) =>
      set((s) => ({
        faces: s.faces.map((c, f) => (f === s.faceAt ? paintCanvas(c, cell, s.faceColor) : c)),
        error: null,
      })),

    faceJoinAt: (a, b) =>
      set((s) => ({
        faces: s.faces.map((c, f) => (f === s.faceAt ? toggleJoin(c, a, b) : c)),
        error: null,
      })),

    setFaceColor: (faceColor) => set({ faceColor }),

    tiltFace: (step) => {
      const { faceAt, faces, finding } = get()
      if (finding) return
      if (step < 0) {
        set({ faceAt: Math.max(0, faceAt - 1), error: null })
        return
      }
      if (!regionsOf(faces[faceAt]!)) {
        set({ error: 'faces' })
        return
      }
      if (faceAt < CANVAS_COUNT - 1) {
        set({ faceAt: faceAt + 1, error: null })
        return
      }
      // The four faces held: the state they show, searched in a worker.
      set({ finding: true, error: null })
      const shape = currentShape()
      const entry = stepOf(shape, 'canvas')!.faces
      void findFaces(shape, viewsOfCanvases(faces)!).then((states) => {
        // Left meanwhile (cancelled, or back to a face): dropped.
        const now = get()
        if (now.mode !== 'edit' || now.phase !== 'canvas' || now.faces !== faces) {
          set({ finding: false })
          return
        }
        // Its colors where the faces say (a sticker where one said absent
        // refuses it).
        const found = states.find((f) => showsCanvases(f, faces, entry))
        if (!found) {
          set({ finding: false, error: 'facesShape' })
          return
        }
        const form = formOf(found.cube)
        // Painted from what the faces show; the rest to paint.
        onwards(form, {
          finding: false,
          edit: { ...emptyEdit(shape, form), ...editOfCanvases(found, faces, entry) },
        })
      })
    },

    toggleAt: (slotKey) =>
      set((s) => {
        const shape = currentShape()
        const spec = togglesAt(shape, s.phase)
        const slot = tablesFor(shape, s.form).byKey.get(slotKey)
        const key = spec && slot && spec.keyAt({ ...slot, stickers: slot.stickers.length })
        if (!spec || !key) return {}
        return {
          toggles: nextToggle(s.toggles, spec, key),
          edit: spec.carry ? spec.carry(s.edit, key, s.toggles[key] ?? 0) : s.edit,
          error: null,
        }
      }),

    acceptStep: () => {
      const shape = currentShape()
      const { phase } = get()
      if (phase === 'joints' && !jointsFit(shape, get().joints)) {
        set({ error: 'joints' })
        return false
      }
      if (phase === 'cuts') {
        const found = stepOf(shape, 'cuts')!.cuts.form(get().cuts)
        if (!found) {
          set({ error: 'cuts' })
          return false
        }
        // The box is no form.
        onwards(formOf(found))
        return true
      }
      onwards(get().form)
      return true
    },

    cancel: () => set({ mode: 'play', preview: undefined, error: null }),

    setColor: (selectedColor) => set({ selectedColor }),

    paintAt: (slotKey, ni) =>
      set((s) => {
        const shape = currentShape()
        const { paint: spec } = entryOf(shape)
        const one = (edit: EditStickers, key: string, keep?: ReadonlySet<string>) =>
          paint(edit, shape, key, ni, s.selectedColor, s.form, keep)
        // Several stickers at once: as the puzzle paints them (a bar), or a
        // block's face as one tile.
        const together = spec.together ?? (stepOf(shape, 'joints') && paintTile(s.joints))
        const edit = together
          ? together(one, s.edit, slotKey, ni, s.selectedColor, s.toggles)
          : one(s.edit, slotKey)
        return {
          edit,
          parts: spec.parts ? spec.parts.complete(s.parts, edit) : s.parts,
          error: null,
        }
      }),

    paintPartAt: (slotKey, ni) =>
      set((s) => {
        const parts = entryOf(currentShape()).paint.parts
        if (!parts) return {}
        return { parts: parts.paint(s.parts, s.edit, slotKey, ni, s.selectedColor), error: null }
      }),

    cycleAt: (slotKey) =>
      set((s) => ({ edit: nextPiece(s.edit, currentShape(), slotKey), error: null })),

    clearAll: () =>
      set((s) => ({
        edit: emptyEdit(currentShape(), s.form),
        parts: {},
        // A step's toggles are not colors: kept; the paint's own cleared.
        toggles: stepOf(currentShape(), 'toggles') ? s.toggles : {},
        error: null,
        fromScan: false,
      })),

    scanned: (edit, form) => {
      // A bandaged puzzle's joints, from where its colors put its pieces
      // (its model fuses those that stand together): its colors next.
      const shape = currentShape()
      const joints = stepOf(shape, 'joints') ? jointsOf(buildCube(edit, shape, form)) : undefined
      // A Fashion-V's cuts, as its form found them (shown if one goes back).
      const cuts = form && stepOf(shape, 'cuts')?.cuts.of(form)
      set({
        edit,
        ...(form && { form, phase: 'paint' as const, preview: undefined }),
        ...(joints && { joints, phase: 'paint' as const }),
        ...(cuts && { cuts }),
        error: null,
        failedStep: null,
        fromScan: true,
      })
    },

    apply: () => {
      const { edit, form, parts, toggles, joints } = get()
      const shape = currentShape()
      if (!isComplete(edit, shape, form) || !partsDone(shape, parts)) return false
      let cube: Cube
      try {
        cube = buildCube(edit, shape, form, { toggles, parts })
      } catch (error) {
        if (!(error instanceof MarksRefused)) throw error
        set({ error: 'parts' })
        return false
      }
      // Its pieces must stand fused as its joints were entered.
      if (stepOf(shape, 'joints') && !matchesJoints(cube, joints)) {
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
  }
})
