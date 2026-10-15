// English names of the puzzles' layers and faces, and the move guide's
// sentences (one per turn, built from its description, see
// lib/app/moveGuide.ts), used by ui.ts.

import type { MoveDescription } from '@/lib/app/moveGuide'
import { fromAbove } from '@/lib/puzzles/round/star'
import type {
  CopterEdge,
  Face,
  GhostSide,
  MegaFace,
  PyraVertex,
  RainbowCorner,
} from '@/lib/core/types'
import type { StarLayer } from '../fr/moveSentences'

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
const COPTER_EDGE_EN: Record<CopterEdge, string> = {
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

/** The move guide's sentence for a turn. */
export function describeEn(d: MoveDescription): string {
  if (d.kind === 'gear' && d.thrice) {
    return `Three half turns of the ${FACE_NAMES_EN[d.face]} in a row: the middle slice goes three quarters round, its gears two and a half turns, and the cube is back in shape, its gears turned over.`
  }
  if (d.kind === 'gear') {
    const sense = d.clockwise ? 'clockwise' : 'counterclockwise'
    return `Turn the ${FACE_NAMES_EN[d.face]} a half turn ${sense}, the opposite face held: the gears drive the middle slice a quarter turn the same way, and its four gears spin five sixths of a turn.`
  }
  if (d.kind === 'slash') {
    return 'The slash: the whole right half makes a half turn, its top pieces going down and its bottom ones up.'
  }
  if (d.kind === 'dinoCorner') {
    const sense = d.clockwise ? 'clockwise' : 'counterclockwise'
    if (d.slice) {
      return `Turn the inner slice of ${DINO_CORNER_NAMES_EN[d.corner]} a third of a turn (120°) ${sense}, as seen from it: six edges and six petals go round, between the two cuts of its diagonal.`
    }
    return `Turn ${DINO_CORNER_NAMES_EN[d.corner]} a third of a turn (120°) ${sense}, as seen from it: ${d.master ? 'its three neighboring corners, its three edges, the three centers around it and nine petals go round with it' : d.skewb ? 'the whole half of the puzzle on its side goes round with it, its three neighboring corners and the three centers around it' : d.rex ? 'its three edges, the three centers around it and nine petals go round with it' : 'its three edges go round it'}.`
  }
  if (d.kind === 'megaFace') {
    const n = Math.abs(d.fifths)
    const sense = d.fifths > 0 ? 'clockwise' : 'counterclockwise'
    return `Turn ${MEGA_FACE_NAMES_EN[d.face]} ${n === 1 ? 'a fifth of a turn (72°)' : 'two fifths of a turn (144°)'} ${sense}, as seen from it: ${d.crystal ? 'its five corners, its five edges and the five edges leaving its corners go round with it' : 'its center stays put, its five edges and five corners go round it'}.`
  }
  if (d.kind === 'ftoFace') {
    const sense = d.clockwise ? 'clockwise' : 'counterclockwise'
    return d.slice
      ? `Turn the slice between ${FTO_FACE_NAMES_EN[d.triangle]} and its opposite a third of a turn (120°) ${sense}, as seen from ${FTO_FACE_NAMES_EN[d.triangle]}: its six edges and six centers go round.`
      : `Turn ${FTO_FACE_NAMES_EN[d.triangle]} a third of a turn (120°) ${sense}, as seen from it: its nine triangles go round, with three corners, three edges and six centers of the faces beside it.`
  }
  if (d.kind === 'triangle') {
    const sense = d.clockwise ? 'clockwise' : 'counterclockwise'
    return `Turn ${TRIANGLE_NAMES_EN[d.triangle]} a third of a turn (120°) ${sense}, as seen from it: its three pieces go round its center, which stays put.`
  }
  if (d.kind === 'puckSlash') {
    return 'The pivot: the whole right half of the disc turns half round the center line, its six top pieces going below and the bottom ones on top, turned over.'
  }
  if (d.kind === 'puckLayer') {
    const n = Math.abs(d.twelfths)
    const notches = n === 1 ? 'one notch' : `${n} notches`
    const sense = d.twelfths > 0 ? 'clockwise' : 'counterclockwise'
    return `Turn the ${d.layer === 'U' ? 'top' : 'bottom'} disc ${notches} (${30 * n}°) ${sense}, as seen from above.`
  }
  if (d.kind === 'fashion') {
    const sense =
      d.turn === 'half'
        ? 'a half turn'
        : `a quarter turn ${d.turn === 'cw' ? 'clockwise' : 'counterclockwise'}, as seen from that side`
    const what = {
      block: `the block of the ${FACE_NAMES_EN[d.face]} (its whole column, its pairs standing or lying with it)`,
      half: `${HALF_NAMES_EN[d.face]} (its two thin layers together)`,
      thin: `the thin layer of the ${FACE_NAMES_EN[d.face]} alone (when its half is laid)`,
      inner: `the thin layer under the ${FACE_NAMES_EN[d.face]} alone (when its half is laid)`,
    }[d.layer]
    return `Turn ${what} ${sense}.`
  }
  if (d.kind === 'copterEdge') {
    return `Turn the ${COPTER_EDGE_EN[d.edge]} edge a half turn about its axis: it pivots in place, its two corners swap${d.iii ? ', with the two centers, six petals and four leaves around' : ', with the four leaves around'}.`
  }
  if (d.kind === 'side') {
    return `Flip ${SIDE_NAMES_EN[d.side]} over with a half turn, about the axis across its cut: its edge turns over, its two corners swap.`
  }
  if ('vertex' in d) {
    const corner = CORNER_NAMES_EN[d.vertex]
    const turn = `a third of a turn (120°) ${d.clockwise ? 'clockwise' : 'counterclockwise'}, as seen from that corner`
    const target = {
      tip: `the tip of the ${corner} alone`,
      corner: `the whole layer of the ${corner} (its tip, its center and its three edges)`,
      half: `the whole half of the ${corner} (its corner, its three edges and the three centers around it)`,
      slice: {
        1: `the first slice of the ${corner}, under its tip (its co-tip and three wings),`,
        2: `the second slice of the ${corner}`,
        3: `the third slice of the ${corner}`,
        4: `the fourth slice of the ${corner}`,
      }[d.slice ?? 1],
      opposite: `the face opposite the ${corner}`,
    }[d.kind]
    return `Turn ${target} ${turn}.`
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
    slice: d.third ? `the third layer from the ${face}` : `the inner slice next to the ${face}`,
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
