import { create } from 'zustand'

/** Bridges a "recenter camera" request from the DOM controls to the 3D scene. */
interface ViewStore {
  /** Bumped each time the view should be recentered. */
  resetToken: number
  resetView: () => void
}

export const useView = create<ViewStore>((set) => ({
  resetToken: 0,
  resetView: () => set((s) => ({ resetToken: s.resetToken + 1 })),
}))
