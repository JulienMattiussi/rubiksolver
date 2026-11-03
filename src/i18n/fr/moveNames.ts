// French names of the puzzles' layers and faces, for the move sentences
// (moveSentences.ts) and the interface (ui.ts).

import type {
  CopterEdge,
  Face,
  GhostSide,
  MegaFace,
  PyraVertex,
  RainbowCorner,
  RingMove,
} from '@/lib/core/types'

/** A star prism's layer. */
export type StarLayer = RingMove['ring']

export const STAR_LAYER_FR: Record<StarLayer, string> = {
  U: 'l’étage du haut',
  u: 'l’étage interne du haut',
  d: 'l’étage interne du bas',
  D: 'l’étage du bas',
}

/** The Pyraminx's corners. */
export const CORNER_NAMES_FR: Record<PyraVertex, string> = {
  U: 'sommet du haut',
  L: 'sommet de gauche',
  R: 'sommet de droite',
  B: 'sommet arrière',
}

/** The Floppy Ghost's sides. */
export const SIDE_NAMES_FR: Record<GhostSide, string> = {
  U: 'le côté du haut',
  R: 'le côté droit',
  D: 'le côté du bas à droite',
  B: 'le côté du bas à gauche',
  L: 'le côté gauche',
}

/** The Curvy Copters' edges, by their two faces. */
export const COPTER_EDGE_FR: Record<CopterEdge, string> = {
  A: 'haut-avant',
  P: 'haut-arrière',
  G: 'haut-gauche',
  D: 'haut-droite',
  O: 'avant-gauche',
  E: 'avant-droite',
  N: 'arrière-gauche',
  S: 'arrière-droite',
  B: 'bas-avant',
  H: 'bas-arrière',
  C: 'bas-gauche',
  T: 'bas-droite',
}

/** The Rainbow's triangles, as the puzzle is held (a square in front). */
export const TRIANGLE_NAMES_FR: Record<RainbowCorner, string> = {
  U: 'le triangle du haut',
  D: 'le triangle du bas',
  L: 'le triangle de gauche',
  R: 'le triangle de droite',
  u: 'le triangle du haut, derrière',
  d: 'le triangle du bas, derrière',
  l: 'le triangle de gauche, derrière',
  r: 'le triangle de droite, derrière',
}

/** The FTO's faces (rainbow.ts, `FTO_LETTERS`): held on its bottom face,
 *  the front one toward us. */
export const FTO_FACE_NAMES_FR: Record<RainbowCorner, string> = {
  U: 'la face du haut',
  u: 'la face avant',
  r: 'la face gauche',
  l: 'la face droite',
  d: 'la face du bas',
  D: 'la face arrière',
  L: 'la face opposée à la gauche',
  R: 'la face opposée à la droite',
}

/** The Dino Cube's corners (the Rainbow's triangles' directions). */
export const DINO_CORNER_NAMES_FR: Record<RainbowCorner, string> = {
  U: 'le sommet du haut, devant à droite',
  u: 'le sommet du haut, derrière à droite',
  l: 'le sommet du haut, derrière à gauche',
  L: 'le sommet du haut, devant à gauche',
  R: 'le sommet du bas, devant à droite',
  r: 'le sommet du bas, derrière à droite',
  d: 'le sommet du bas, derrière à gauche',
  D: 'le sommet du bas, devant à gauche',
}

export const FACE_NAMES_FR: Record<Face, string> = {
  U: 'face du haut',
  D: 'face du bas',
  L: 'face de gauche',
  R: 'face de droite',
  F: 'face avant',
  B: 'face arrière',
}

/** The half of the puzzle on a face's side (a wide turn on four layers). */
export const HALF_NAMES_FR: Record<Face, string> = {
  U: 'la moitié du haut',
  D: 'la moitié du bas',
  L: 'la moitié gauche',
  R: 'la moitié droite',
  F: 'la moitié avant',
  B: 'la moitié arrière',
}

/** The Megaminx's faces, as it is held (megaminx.ts). */
export const MEGA_FACE_NAMES_FR: Record<MegaFace, string> = {
  U: 'la face du haut',
  F: 'la face avant',
  R: 'la face de droite',
  L: 'la face de gauche',
  BR: 'la face arrière droite',
  BL: 'la face arrière gauche',
  DR: 'la face du bas à droite',
  DL: 'la face du bas à gauche',
  DBR: 'la face du bas arrière droite',
  DBL: 'la face du bas arrière gauche',
  B: 'la face arrière du bas',
  D: 'la face du dessous',
}
