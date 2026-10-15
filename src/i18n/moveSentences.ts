// Names of the puzzles' layers and faces, and the move guide's sentences
// (one per turn, built from its description, see lib/app/moveGuide.ts). Content
// shared by the two languages of translations.ts.

import type { MoveDescription } from '@/lib/app/moveGuide'
import { fromAbove } from '@/lib/puzzles/round/star'
import type {
  Face,
  GhostSide,
  MegaFace,
  PyraVertex,
  RainbowCorner,
  RingMove,
} from '@/lib/core/types'

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

/** The Pyraminx's corners. */
export const CORNER_NAMES_FR: Record<PyraVertex, string> = {
  U: 'sommet du haut',
  L: 'sommet de gauche',
  R: 'sommet de droite',
  B: 'sommet arrière',
}

export const CORNER_NAMES_EN: Record<PyraVertex, string> = {
  U: 'top corner',
  L: 'left corner',
  R: 'right corner',
  B: 'back corner',
}

/** The Floppy Ghost's sides. */
export const SIDE_NAMES_FR: Record<GhostSide, string> = {
  U: 'le côté du haut',
  R: 'le côté droit',
  D: 'le côté du bas à droite',
  B: 'le côté du bas à gauche',
  L: 'le côté gauche',
}

export const SIDE_NAMES_EN: Record<GhostSide, string> = {
  U: 'the top side',
  R: 'the right side',
  D: 'the bottom right side',
  B: 'the bottom left side',
  L: 'the left side',
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
export function describeFr(d: MoveDescription): string {
  if (d.kind === 'gear' && d.thrice) {
    return `Trois demi-tours de la ${FACE_NAMES_FR[d.face]} de suite : la tranche du milieu fait trois quarts de tour, ses engrenages deux tours et demi, et le cube reprend sa forme, engrenages retournés.`
  }
  if (d.kind === 'gear') {
    const sense = d.clockwise ? 'des aiguilles' : 'inverse des aiguilles'
    return `On tourne la ${FACE_NAMES_FR[d.face]} d’un demi-tour dans le sens ${sense} d’une montre, la face opposée tenue : les engrenages entraînent la tranche du milieu d’un quart de tour, dans le même sens, et ses quatre engrenages pivotent de cinq sixièmes de tour.`
  }
  if (d.kind === 'slash') {
    return 'Le slash : toute la moitié droite fait un demi-tour, ses pièces du haut passent en bas et celles du bas en haut.'
  }
  if (d.kind === 'dinoCorner') {
    const sense = d.clockwise ? 'des aiguilles' : 'inverse des aiguilles'
    if (d.slice) {
      return `On tourne la tranche intérieure de ${DINO_CORNER_NAMES_FR[d.corner]} d’un tiers de tour (120°) dans le sens ${sense} d’une montre, vu depuis lui : six arêtes et six pétales tournent, entre les deux coupes de sa diagonale.`
    }
    return `On tourne ${DINO_CORNER_NAMES_FR[d.corner]} d’un tiers de tour (120°) dans le sens ${sense} d’une montre, vu de face : ${d.master ? 'ses trois sommets voisins, ses trois arêtes, les trois centres autour et neuf pétales tournent avec lui' : d.skewb ? 'toute la moitié du puzzle de son côté tourne avec lui, ses trois sommets voisins et les trois centres autour' : d.rex ? 'ses trois arêtes, les trois centres autour et neuf pétales tournent avec lui' : 'ses trois arêtes tournent autour de lui'}.`
  }
  if (d.kind === 'megaFace') {
    const n = Math.abs(d.fifths)
    const sense = d.fifths > 0 ? 'des aiguilles' : 'inverse des aiguilles'
    return `On tourne ${MEGA_FACE_NAMES_FR[d.face]} ${n === 1 ? 'd’un cinquième de tour (72°)' : 'de deux cinquièmes de tour (144°)'} dans le sens ${sense} d’une montre, vu de face : ${d.crystal ? 'ses cinq sommets, ses cinq arêtes et les cinq arêtes qui partent de ses sommets tournent avec elle' : 'son centre ne bouge pas, ses cinq arêtes et ses cinq sommets tournent autour'}.`
  }
  if (d.kind === 'ftoFace') {
    const sense = d.clockwise ? 'des aiguilles' : 'inverse des aiguilles'
    return d.slice
      ? `On tourne la tranche entre ${FTO_FACE_NAMES_FR[d.triangle]} et sa face opposée d’un tiers de tour (120°) dans le sens ${sense} d’une montre, vu depuis ${FTO_FACE_NAMES_FR[d.triangle]} : ses six arêtes et six centres tournent.`
      : `On tourne ${FTO_FACE_NAMES_FR[d.triangle]} d’un tiers de tour (120°) dans le sens ${sense} d’une montre, vu de face : ses neuf triangles tournent, avec trois sommets, trois arêtes et six centres des faces voisines.`
  }
  if (d.kind === 'triangle') {
    const sense = d.clockwise ? 'des aiguilles' : 'inverse des aiguilles'
    return `On tourne ${TRIANGLE_NAMES_FR[d.triangle]} d’un tiers de tour (120°) dans le sens ${sense} d’une montre, vu de face : ses trois pièces tournent autour de son centre, qui ne bouge pas.`
  }
  if (d.kind === 'puckSlash') {
    return 'Le pivot : toute la moitié droite du disque fait un demi-tour sur l’axe central, ses six pièces du haut passent en bas et celles du bas en haut, retournées.'
  }
  if (d.kind === 'puckLayer') {
    const n = Math.abs(d.twelfths)
    const notches = n === 1 ? 'd’un cran' : `de ${n} crans`
    const sense = d.twelfths > 0 ? 'des aiguilles' : 'inverse des aiguilles'
    return `On tourne le disque ${d.layer === 'U' ? 'du haut' : 'du bas'} ${notches} (${30 * n}°) dans le sens ${sense} d’une montre, vu de dessus.`
  }
  if (d.kind === 'side') {
    return `On retourne ${SIDE_NAMES_FR[d.side]} d’un demi-tour, autour de l’axe perpendiculaire à sa coupe : son arête se retourne, ses deux sommets s’échangent.`
  }
  if ('vertex' in d) {
    const corner = CORNER_NAMES_FR[d.vertex]
    const sense = d.clockwise ? 'des aiguilles' : 'inverse des aiguilles'
    const turn = `d’un tiers de tour (120°) dans le sens ${sense} d’une montre, vu depuis ce sommet`
    const target = {
      tip: `la seule pointe du ${corner}`,
      corner: `toute la couche du ${corner} (sa pointe, son centre et ses trois arêtes)`,
      half: `toute la moitié du ${corner} (son coin, ses trois arêtes et les trois centres autour)`,
      slice: {
        1: `la première tranche du ${corner}, sous sa pointe (son co-sommet et trois ailes),`,
        2: `la deuxième tranche du ${corner}`,
        3: `la troisième tranche du ${corner}`,
        4: `la quatrième tranche du ${corner}`,
      }[d.slice ?? 1],
      opposite: `la face opposée au ${corner}`,
    }[d.kind]
    return `On tourne ${target} ${turn}.`
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
    slice: d.third
      ? `la troisième couche depuis la ${face}`
      : `la tranche interne voisine de la ${face}`,
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
  if (d.kind === 'gear' && d.thrice) {
    return `Three half turns of the ${FACE_NAMES_EN[d.face]} in a row: the middle slice goes three quarters round, its gears two and a half turns, and the cube is back in shape, its gears turned over.`
  }
  if (d.kind === 'gear') {
    const sense = d.clockwise ? 'clockwise' : 'counter-clockwise'
    return `Turn the ${FACE_NAMES_EN[d.face]} a half turn ${sense}, the opposite face held: the gears drive the middle slice a quarter turn the same way, and its four gears spin five sixths of a turn.`
  }
  if (d.kind === 'slash') {
    return 'The slash: the whole right half makes a half turn, its top pieces going down and its bottom ones up.'
  }
  if (d.kind === 'dinoCorner') {
    const sense = d.clockwise ? 'clockwise' : 'counter-clockwise'
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
