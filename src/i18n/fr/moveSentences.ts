// French names of the puzzles' layers and faces, and the move guide's
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
const COPTER_EDGE_FR: Record<CopterEdge, string> = {
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
const HALF_NAMES_FR: Record<Face, string> = {
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
  if (d.kind === 'fashion') {
    const sense =
      d.turn === 'half'
        ? 'd’un demi-tour'
        : `d’un quart de tour dans le sens ${d.turn === 'cw' ? 'des aiguilles' : 'inverse des aiguilles'} d’une montre, vu de face`
    const what = {
      block: `le bloc de la ${FACE_NAMES_FR[d.face]} (toute sa colonne, ses paires debout ou couchées avec lui)`,
      half: `${HALF_NAMES_FR[d.face]} (ses deux couches fines ensemble)`,
      thin: `la couche fine de la ${FACE_NAMES_FR[d.face]} seule (quand sa moitié est couchée)`,
      inner: `la couche fine sous la ${FACE_NAMES_FR[d.face]} seule (quand sa moitié est couchée)`,
    }[d.layer]
    return `On tourne ${what} ${sense}.`
  }
  if (d.kind === 'copterEdge') {
    return `On tourne l’arête ${COPTER_EDGE_FR[d.edge]} d’un demi-tour autour de son axe : elle pivote sur place, ses deux sommets s’échangent${d.iii ? ', avec les deux centres, six pétales et quatre feuilles autour' : ', avec les quatre feuilles autour'}.`
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
