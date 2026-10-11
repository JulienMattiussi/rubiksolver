// Names of the puzzles' layers and faces, and the move guide's sentences
// (one per turn, built from its description, see lib/moveGuide.ts). Content
// shared by the two languages of translations.ts.

import type { MoveDescription } from '@/lib/moveGuide'
import { fromAbove } from '@/lib/star'
import type { Face, RingMove } from '@/lib/types'

export type StarLayer = RingMove['ring']

export const STAR_LAYER_FR: Record<StarLayer, string> = {
  U: 'l’étage du haut',
  u: 'l’étage interne du haut',
  d: 'l’étage interne du bas',
  D: 'l’étage du bas',
}

export const STAR_LAYER_EN: Record<StarLayer, string> = {
  U: 'top',
  u: 'inner top',
  d: 'inner bottom',
  D: 'bottom',
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
const HALF_NAMES_FR: Record<Face, string> = {
  U: 'la moitié du haut',
  D: 'la moitié du bas',
  L: 'la moitié gauche',
  R: 'la moitié droite',
  F: 'la moitié avant',
  B: 'la moitié arrière',
}

const HALF_NAMES_EN: Record<Face, string> = {
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

/** The move guide's sentence for a turn. */
export function describeFr(d: MoveDescription): string {
  if (d.kind === 'slash') {
    return 'Le slash : toute la moitié droite fait un demi-tour, ses pièces du haut passent en bas et celles du bas en haut.'
  }
  if (d.kind === 'ring') {
    const layer = STAR_LAYER_FR[d.ring]
    if (d.pieces === 3) {
      return `On tourne ${layer} de trois crans, soit un demi-tour : le sens n’a pas d’importance.`
    }
    const notches = d.pieces === 1 ? 'd’un cran' : 'de deux crans'
    const sense = d.clockwise ? 'des aiguilles' : 'inverse des aiguilles'
    const seen = fromAbove(d.ring) ? 'vu de dessus' : 'vu de dessous'
    return `On tourne ${layer} ${notches} (${60 * d.pieces}°) dans le sens ${sense} d’une montre, ${seen}.`
  }
  const face = FACE_NAMES_FR[d.face]
  const target = {
    face: `la ${face}`,
    middle: `la tranche du milieu, parallèle à la ${face},`,
    slice: `la tranche interne voisine de la ${face}`,
    wide: d.halfPuzzle
      ? `toute ${HALF_NAMES_FR[d.face]} du puzzle`
      : `la ${face} et la tranche interne voisine ensemble`,
  }[d.kind]
  const how =
    d.turn === 'half'
      ? 'd’un demi-tour : le sens n’a pas d’importance'
      : `d’un quart de tour dans le sens ${d.turn === 'cw' ? 'des aiguilles' : 'inverse des aiguilles'} d’une montre, vu depuis la ${face}`
  return `On tourne ${target} ${how}.`
}

export function describeEn(d: MoveDescription): string {
  if (d.kind === 'slash') {
    return 'The slash: the whole right half makes a half turn, its top pieces going down and its bottom ones up.'
  }
  if (d.kind === 'ring') {
    const layer = `the ${STAR_LAYER_EN[d.ring]} layer`
    if (d.pieces === 3) {
      return `Turn ${layer} three notches, a half turn: the direction does not matter.`
    }
    const notches = d.pieces === 1 ? 'one notch' : 'two notches'
    const sense = d.clockwise ? 'clockwise' : 'counterclockwise'
    const seen = fromAbove(d.ring) ? 'as seen from above' : 'as seen from below'
    return `Turn ${layer} ${notches} (${60 * d.pieces}°) ${sense}, ${seen}.`
  }
  const face = FACE_NAMES_EN[d.face]
  const target = {
    face: `the ${face}`,
    middle: `the middle slice, parallel to the ${face},`,
    slice: `the inner slice next to the ${face}`,
    wide: d.halfPuzzle
      ? `${HALF_NAMES_EN[d.face]} of the puzzle`
      : `the ${face} and the inner slice next to it together`,
  }[d.kind]
  const how =
    d.turn === 'half'
      ? 'a half turn: the direction does not matter'
      : `a quarter turn ${d.turn === 'cw' ? 'clockwise' : 'counterclockwise'}, as seen from the ${face}`
  return `Turn ${target} ${how}.`
}
