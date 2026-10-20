import { create } from 'zustand'
import type { Turn, Vec3 } from '@/lib/core/types'

/** Bridges view requests from the DOM controls to the 3D scene. */
/** How far, and toward which side, the view rises from a face it turns to
 *  (none: a little toward the top). */
export interface Lift {
  readonly amount: number
  readonly toward: Vec3
}

interface ViewStore {
  /** Bumped each time the view should be recentered. */
  resetToken: number
  resetView: () => void
  /** A face to turn the view toward (its outward normal), how far above
   *  it to look from (`lift`, none: a little), and a token bumped each time
   *  it is asked. */
  toward: { normal: Vec3; lift?: Lift; token: number } | null
  /** Turn the view to face the face of this outward normal (from higher
   *  up with a `lift`: the top in sight, for the last layer). */
  viewToward: (normal: Vec3, lift?: Lift) => void
  /** Turn whose pieces the scene highlights (a pad button is hovered or
   *  focused), or null. */
  preview: Turn | null
  setPreview: (move: Turn | null) => void
  /** Whether the panel is folded (a phone's: the puzzle in sight, a bar
   *  of its main actions); scrambling and solving fold it. */
  folded: boolean
  setFolded: (folded: boolean) => void
}

export const useView = create<ViewStore>((set) => ({
  resetToken: 0,
  resetView: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  toward: null,
  viewToward: (normal, lift) =>
    set((s) => ({ toward: { normal, lift, token: (s.toward?.token ?? 0) + 1 } })),
  preview: null,
  setPreview: (preview) => set({ preview }),
  folded: false,
  setFolded: (folded) => set({ folded }),
}))
