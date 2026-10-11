import { create } from 'zustand'
import type { Turn } from '@/lib/types'

/** Bridges view requests from the DOM controls to the 3D scene. */
interface ViewStore {
  /** Bumped each time the view should be recentered. */
  resetToken: number
  resetView: () => void
  /** Turn whose pieces the scene highlights (a pad button is hovered or
   *  focused), or null. */
  preview: Turn | null
  setPreview: (move: Turn | null) => void
}

export const useView = create<ViewStore>((set) => ({
  resetToken: 0,
  resetView: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  preview: null,
  setPreview: (preview) => set({ preview }),
}))
