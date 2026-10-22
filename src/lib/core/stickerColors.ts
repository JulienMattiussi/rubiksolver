import type { Color } from './types'

/**
 * Sticker colors of the physical puzzles (the cube's standard Western
 * scheme, then the other puzzles' colors), as the 3D view paints them
 * (three/core/colors.ts) and as a camera scan first looks for them
 * (editor/scan/anchors.ts).
 */
export const COLOR_HEX: Record<Color, string> = {
  W: '#f8fafc',
  Y: '#facc15',
  G: '#22c55e',
  B: '#3b82f6',
  O: '#f97316',
  R: '#ef4444',
  // The star prism's two extra valley colors.
  P: '#ec4899',
  V: '#8b5cf6',
  // The Rainbow's other triangles.
  E: '#15803d',
  N: '#1e40af',
  T: '#2dd4bf',
  K: '#fbcfe8',
  M: '#92400e',
  L: '#a3e635',
  // The GEM-0's squares, golden.
  C: '#d6b25e',
  // The Hockey Puck's center, graphite (drawn only: no sticker wears it).
  H: '#5b6273',
}
