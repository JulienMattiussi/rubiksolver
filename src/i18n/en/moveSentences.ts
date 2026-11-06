// Every turn's English sentences, built from its description
// (lib/app/moveGuide.ts), a table by kind: the move guide's, long, and the
// tutorial's, short. Used by ui.ts.

import type { MoveDescription } from '@/lib/core/guide'
import { fromAbove } from '@/lib/puzzles/round/star'
import { sentenceOf, type Described, type MoveSentences } from '../moveSentences'
import {
  CORNER_NAMES_EN,
  COPTER_EDGE_EN,
  DINO_CORNER_NAMES_EN,
  FACE_NAMES_EN,
  FTO_FACE_NAMES_EN,
  HALF_NAMES_EN,
  MEGA_FACE_NAMES_EN,
  SIDE_NAMES_EN,
  STAR_LAYER_EN,
  TRIANGLE_NAMES_EN,
} from './moveNames'

const senseEn = (clockwise: boolean) => (clockwise ? 'clockwise' : 'counterclockwise')

/** A cube's layer, the puzzle turned whole included. */
type CubeLayer = Described<'face' | 'middle' | 'slice' | 'wide' | 'whole'>

function cubeLayerLong(d: CubeLayer): string {
  const face = FACE_NAMES_EN[d.face]
  const target = {
    face: `the ${face}`,
    middle: `the middle slice, parallel to the ${face},`,
    slice: d.third ? `the third layer from the ${face}` : `the inner slice next to the ${face}`,
    wide: d.halfPuzzle
      ? `${HALF_NAMES_EN[d.face]} of the puzzle`
      : `the ${face} and the inner slice next to it together`,
    whole: 'the whole cube in your hands',
  }[d.kind]
  const how =
    d.turn === 'half'
      ? 'a half turn: the direction does not matter'
      : `a quarter turn ${senseEn(d.turn === 'cw')}, as seen from the ${face}`
  return `Turn ${target} ${how}.`
}

/** The move guide's sentences. */
const LONG: MoveSentences = {
  face: cubeLayerLong,
  middle: cubeLayerLong,
  slice: cubeLayerLong,
  wide: cubeLayerLong,
  whole: cubeLayerLong,
  gear: (d) =>
    d.thrice
      ? `Three half turns of the ${FACE_NAMES_EN[d.face]} in a row: the middle slice goes three quarters round, its gears two and a half turns, and the cube is back in shape, its gears turned over.`
      : `Turn the ${FACE_NAMES_EN[d.face]} a half turn ${senseEn(d.clockwise)}, the opposite face held: the gears drive the middle slice a quarter turn the same way, and its four gears spin five sixths of a turn.`,
  slash: () =>
    'The slash: the whole right half makes a half turn, its top pieces going down and its bottom ones up.',
  dinoCorner: (d) =>
    d.slice
      ? `Turn the inner slice of ${DINO_CORNER_NAMES_EN[d.corner]} a third of a turn (120°) ${senseEn(d.clockwise)}, as seen from it: six edges and six petals go round, between the two cuts of its diagonal.`
      : `Turn ${DINO_CORNER_NAMES_EN[d.corner]} a third of a turn (120°) ${senseEn(d.clockwise)}, as seen from it: ${{ layer: 'its three neighboring corners, its three edges, the three centers around it and nine petals go round with it', half: 'the whole half of the puzzle on its side goes round with it, its three neighboring corners and the three centers around it', petals: 'its three edges, the three centers around it and nine petals go round with it', edges: 'its three edges go round it' }[d.takes]}.`,
  megaFace: (d) =>
    d.whole
      ? `Turn the whole puzzle in your hands about ${MEGA_FACE_NAMES_EN[d.face]}, ${Math.abs(d.fifths) === 1 ? 'a fifth of a turn (72°)' : 'two fifths of a turn (144°)'} ${senseEn(d.fifths > 0)}, as seen from it: nothing moves on the puzzle, a hidden face comes in front of you.`
      : `Turn ${MEGA_FACE_NAMES_EN[d.face]} ${Math.abs(d.fifths) === 1 ? 'a fifth of a turn (72°)' : 'two fifths of a turn (144°)'} ${senseEn(d.fifths > 0)}, as seen from it: ${d.crystal ? 'its five corners, its five edges and the five edges leaving its corners go round with it' : 'its center stays put, its five edges and five corners go round it'}.`,
  ftoFace: (d) =>
    d.slice
      ? `Turn the slice between ${FTO_FACE_NAMES_EN[d.triangle]} and its opposite a third of a turn (120°) ${senseEn(d.clockwise)}, as seen from ${FTO_FACE_NAMES_EN[d.triangle]}: its six edges and six centers go round.`
      : `Turn ${FTO_FACE_NAMES_EN[d.triangle]} a third of a turn (120°) ${senseEn(d.clockwise)}, as seen from it: its nine triangles go round, with three corners, three edges and six centers of the faces beside it.`,
  triangle: (d) =>
    `Turn ${TRIANGLE_NAMES_EN[d.triangle]} a third of a turn (120°) ${senseEn(d.clockwise)}, as seen from it: its three pieces go round its center, which stays put.`,
  sectorSlash: () =>
    'The pivot: the whole right half of the disc turns half round the center line, its six top pieces going below and the bottom ones on top, turned over.',
  sectorLayer: (d) => {
    const n = Math.abs(d.twelfths)
    const notches = n === 1 ? 'one notch' : `${n} notches`
    return `Turn the ${d.layer === 'U' ? 'top' : 'bottom'} disc ${notches} (${30 * n}°) ${senseEn(d.twelfths > 0)}, as seen from ${d.layer === 'U' ? 'above' : 'below'}.`
  },
  layers: (d) => {
    const face = FACE_NAMES_EN[d.face]
    const what = {
      block: `the block of the ${face} (its whole column, its pairs standing or lying with it)`,
      half: `${HALF_NAMES_EN[d.face]} (all on that side of its cut)`,
      thin: `the thin layer of the ${face} alone`,
      inner: `the thin layer under the ${face} alone`,
    }[d.layer]
    const how =
      d.turn === 'half'
        ? 'a half turn'
        : `a quarter turn ${senseEn(d.turn === 'cw')}, as seen from that side`
    return `Turn ${what} ${how}, if nothing blocks its cut.`
  },
  copterEdge: (d) =>
    `Turn the ${COPTER_EDGE_EN[d.edge]} edge a half turn about its axis: it pivots in place, its two corners swap${d.iii ? ', with the two centers, six petals and four leaves around' : ', with the four leaves around'}.`,
  side: (d) =>
    `Flip ${SIDE_NAMES_EN[d.side]} over with a half turn, about the axis across its cut: its edge turns over, its two corners swap.`,
  pyra: (d) => {
    const corner = CORNER_NAMES_EN[d.vertex]
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
    }[d.part]
    return `Turn ${target} a third of a turn (120°) ${senseEn(d.clockwise)}, as seen from that corner.`
  },
  ring: (d) => {
    const layer = `the ${STAR_LAYER_EN[d.ring]} layer`
    if (d.pieces === 3) {
      return `Turn ${layer} three notches, a half turn: the direction does not matter.`
    }
    const notches = d.pieces === 1 ? 'one notch' : 'two notches'
    const seen = fromAbove(d.ring) ? 'as seen from above' : 'as seen from below'
    return `Turn ${layer} ${notches} (${60 * d.pieces}°) ${senseEn(d.clockwise)}, ${seen}.`
  },
}

/** A name with a comma in it closed by another. */
const closed = (name: string) => (name.includes(',') ? `${name},` : name)

function cubeLayerShort(d: CubeLayer): string {
  const face = FACE_NAMES_EN[d.face]
  const what = {
    face: `the ${face}`,
    middle: `the middle slice (parallel to the ${face})`,
    slice: d.third ? `the third layer from the ${face}` : `the inner slice next to the ${face}`,
    wide: d.halfPuzzle ? HALF_NAMES_EN[d.face] : `the ${face} and the slice next to it`,
    whole: 'the whole cube',
  }[d.kind]
  if (d.turn === 'half') return `Turn ${what} twice (a half turn)`
  const seen = d.kind === 'face' ? 'facing it' : `seen from the ${face}`
  return `Turn ${what} ${senseEn(d.turn === 'cw')}, ${seen}`
}

/** The tutorial's sentences: what turns, how far and which way, without
 *  the guide's details. */
const SHORT: MoveSentences = {
  face: cubeLayerShort,
  middle: cubeLayerShort,
  slice: cubeLayerShort,
  wide: cubeLayerShort,
  whole: cubeLayerShort,
  gear: (d) =>
    d.thrice
      ? `Three half turns of the ${FACE_NAMES_EN[d.face]} in a row`
      : `Turn the ${FACE_NAMES_EN[d.face]} a half turn ${senseEn(d.clockwise)}, facing it`,
  slash: () => 'Turn the right half a half turn (the slash)',
  dinoCorner: (d) => {
    const corner = DINO_CORNER_NAMES_EN[d.corner]
    const what = d.slice ? `the inner slice of ${corner}` : corner
    return `Turn ${what} a third of a turn ${senseEn(d.clockwise)}, seen from it`
  },
  megaFace: (d) =>
    `Turn ${d.whole ? `the whole puzzle about ${MEGA_FACE_NAMES_EN[d.face]}` : MEGA_FACE_NAMES_EN[d.face]} ${Math.abs(d.fifths) === 1 ? 'a fifth of a turn' : 'two fifths of a turn'} ${senseEn(d.fifths > 0)}, facing it`,
  ftoFace: (d) => {
    const face = FTO_FACE_NAMES_EN[d.triangle]
    return d.slice
      ? `Turn the slice next to ${face} a third of a turn ${senseEn(d.clockwise)}, seen from ${face}`
      : `Turn ${face} a third of a turn ${senseEn(d.clockwise)}, facing it`
  },
  triangle: (d) =>
    `Turn ${closed(TRIANGLE_NAMES_EN[d.triangle])} a third of a turn ${senseEn(d.clockwise)}, facing it`,
  sectorSlash: () => 'Turn the right half of the disc a half turn (the pivot)',
  sectorLayer: (d) => {
    const n = Math.abs(d.twelfths)
    return `Turn the ${d.layer === 'U' ? 'top' : 'bottom'} disc ${n === 1 ? 'one notch' : `${n} notches`} ${senseEn(d.twelfths > 0)}, seen from ${d.layer === 'U' ? 'above' : 'below'}`
  },
  layers: (d) => {
    const face = FACE_NAMES_EN[d.face]
    const what = {
      block: `the block of the ${face}`,
      half: HALF_NAMES_EN[d.face],
      thin: `the thin layer of the ${face}`,
      inner: `the thin layer under the ${face}`,
    }[d.layer]
    return d.turn === 'half'
      ? `Turn ${what} a half turn`
      : `Turn ${what} ${senseEn(d.turn === 'cw')}, seen from that side`
  },
  copterEdge: (d) => `Turn the ${COPTER_EDGE_EN[d.edge]} edge a half turn about its axis`,
  side: (d) => `Flip ${SIDE_NAMES_EN[d.side]} over`,
  pyra: (d) => {
    const corner = CORNER_NAMES_EN[d.vertex]
    const what = {
      tip: `the tip of the ${corner}`,
      corner: `the layer of the ${corner}`,
      half: `the half of the ${corner}`,
      slice: `the ${{ 1: 'first', 2: 'second', 3: 'third', 4: 'fourth' }[d.slice ?? 1]} slice of the ${corner}`,
      opposite: `the face opposite the ${corner}`,
    }[d.part]
    return `Turn ${what} a third of a turn ${senseEn(d.clockwise)}, seen from that corner`
  },
  ring: (d) => {
    const layer = `the ${STAR_LAYER_EN[d.ring]} layer`
    if (d.pieces === 3) return `Turn ${layer} a half turn (three notches)`
    const seen = fromAbove(d.ring) ? 'seen from above' : 'seen from below'
    return `Turn ${layer} ${d.pieces === 1 ? 'one notch' : 'two notches'} ${senseEn(d.clockwise)}, ${seen}`
  },
}

/** The move guide's sentence for a turn. */
export const describeEn = (d: MoveDescription): string => sentenceOf(LONG, d)

/** A turn's short sentence (the tutorial's, beside its letters). */
export const describeShortEn = (d: MoveDescription): string => sentenceOf(SHORT, d)
