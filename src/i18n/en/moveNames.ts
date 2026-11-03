// English names of the puzzles' layers and faces, for the move sentences
// (moveSentences.ts) and the interface (ui.ts).

import type {
  CopterEdge,
  Face,
  GhostSide,
  MegaFace,
  PyraVertex,
  RainbowCorner,
} from '@/lib/core/types'
import type { StarLayer } from '../fr/moveNames'

export const STAR_LAYER_EN: Record<StarLayer, string> = {
  U: 'top',
  u: 'inner top',
  d: 'inner bottom',
  D: 'bottom',
}

/** The Pyraminx's corners. */
export const CORNER_NAMES_EN: Record<PyraVertex, string> = {
  U: 'top corner',
  L: 'left corner',
  R: 'right corner',
  B: 'back corner',
}

/** The Floppy Ghost's sides. */
export const SIDE_NAMES_EN: Record<GhostSide, string> = {
  U: 'the top side',
  R: 'the right side',
  D: 'the bottom right side',
  B: 'the bottom left side',
  L: 'the left side',
}

/** The Curvy Copters' edges, by their two faces. */
export const COPTER_EDGE_EN: Record<CopterEdge, string> = {
  A: 'top front',
  P: 'top back',
  G: 'top left',
  D: 'top right',
  O: 'front left',
  E: 'front right',
  N: 'back left',
  S: 'back right',
  B: 'bottom front',
  H: 'bottom back',
  C: 'bottom left',
  T: 'bottom right',
}

/** The Rainbow's triangles, as the puzzle is held (a square in front). */
export const TRIANGLE_NAMES_EN: Record<RainbowCorner, string> = {
  U: 'the top triangle',
  D: 'the bottom triangle',
  L: 'the left triangle',
  R: 'the right triangle',
  u: 'the top triangle, behind',
  d: 'the bottom triangle, behind',
  l: 'the left triangle, behind',
  r: 'the right triangle, behind',
}

/** The FTO's faces (rainbow.ts, `FTO_LETTERS`): held on its bottom face,
 *  the front one toward us. */
export const FTO_FACE_NAMES_EN: Record<RainbowCorner, string> = {
  U: 'the top face',
  u: 'the front face',
  r: 'the left face',
  l: 'the right face',
  d: 'the bottom face',
  D: 'the back face',
  L: 'the face opposite the left one',
  R: 'the face opposite the right one',
}

/** The Dino Cube's corners (the Rainbow's triangles' directions). */
export const DINO_CORNER_NAMES_EN: Record<RainbowCorner, string> = {
  U: 'the top front right corner',
  u: 'the top back right corner',
  l: 'the top back left corner',
  L: 'the top front left corner',
  R: 'the bottom front right corner',
  r: 'the bottom back right corner',
  d: 'the bottom back left corner',
  D: 'the bottom front left corner',
}

/** The half of the puzzle on a face's side (a wide turn on four layers). */
export const HALF_NAMES_EN: Record<Face, string> = {
  U: 'the top half',
  D: 'the bottom half',
  L: 'the left half',
  R: 'the right half',
  F: 'the front half',
  B: 'the back half',
}

export const FACE_NAMES_EN: Record<Face, string> = {
  U: 'top face',
  D: 'bottom face',
  L: 'left face',
  R: 'right face',
  F: 'front face',
  B: 'back face',
}

/** The Megaminx's faces, as it is held (megaminx.ts). */
export const MEGA_FACE_NAMES_EN: Record<MegaFace, string> = {
  U: 'the top face',
  F: 'the front face',
  R: 'the right face',
  L: 'the left face',
  BR: 'the back right face',
  BL: 'the back left face',
  DR: 'the lower right face',
  DL: 'the lower left face',
  DBR: 'the lower back right face',
  DBL: 'the lower back left face',
  B: 'the lower back face',
  D: 'the bottom face',
}
