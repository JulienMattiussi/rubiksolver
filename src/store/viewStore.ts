import { create } from 'zustand'
import type { Turn, Vec3 } from '@/lib/core/types'

/** Bridges view requests from the DOM controls to the 3D scene. */
interface ViewStore {
  /** Bumped each time the view should be recentered. */
  resetToken: number
  resetView: () => void
  /** A face to turn the view toward (its outward normal), and a token
   *  bumped each time it is asked. */
  toward: { normal: Vec3; token: number } | null
  /** Turn the view to face the face of this outward normal. */
  viewToward: (normal: Vec3) => void
  /** Turn whose pieces the scene highlights (a pad button is hovered or
   *  focused), or null. */
  preview: Turn | null
  setPreview: (move: Turn | null) => void
}

export const useView = create<ViewStore>((set) => ({
  resetToken: 0,
  resetView: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  toward: null,
  viewToward: (normal) => set((s) => ({ toward: { normal, token: (s.toward?.token ?? 0) + 1 } })),
  preview: null,
  setPreview: (preview) => set({ preview }),
}))
