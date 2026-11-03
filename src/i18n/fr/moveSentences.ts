// Every turn's French sentences, built from its description
// (lib/app/moveGuide.ts), a table by kind: the move guide's, long, and the
// tutorial's, short. Used by ui.ts.

import type { MoveDescription } from '@/lib/core/guide'
import { fromAbove } from '@/lib/puzzles/round/star'
import { sentenceOf, type Described, type MoveSentences } from '../moveSentences'
import {
  CORNER_NAMES_FR,
  COPTER_EDGE_FR,
  DINO_CORNER_NAMES_FR,
  FACE_NAMES_FR,
  FTO_FACE_NAMES_FR,
  HALF_NAMES_FR,
  MEGA_FACE_NAMES_FR,
  SIDE_NAMES_FR,
  STAR_LAYER_FR,
  TRIANGLE_NAMES_FR,
} from './moveNames'

/** « des aiguilles » or « inverse des aiguilles » (d’une montre). */
const hands = (clockwise: boolean) => (clockwise ? 'des aiguilles' : 'inverse des aiguilles')

/** A cube's layer, the puzzle turned whole included. */
type CubeLayer = Described<'face' | 'middle' | 'slice' | 'wide' | 'whole'>

function cubeLayerLong(d: CubeLayer): string {
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
    whole: 'tout le cube dans tes mains',
  }[d.kind]
  const how =
    d.turn === 'half'
      ? 'd’un demi-tour : le sens n’a pas d’importance'
      : `d’un quart de tour dans le sens ${hands(d.turn === 'cw')} d’une montre, vu depuis la ${face}`
  return `On tourne ${target} ${how}.`
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
      ? `Trois demi-tours de la ${FACE_NAMES_FR[d.face]} de suite : la tranche du milieu fait trois quarts de tour, ses engrenages deux tours et demi, et le cube reprend sa forme, engrenages retournés.`
      : `On tourne la ${FACE_NAMES_FR[d.face]} d’un demi-tour dans le sens ${hands(d.clockwise)} d’une montre, la face opposée tenue : les engrenages entraînent la tranche du milieu d’un quart de tour, dans le même sens, et ses quatre engrenages pivotent de cinq sixièmes de tour.`,
  slash: () =>
    'Le slash : toute la moitié droite fait un demi-tour, ses pièces du haut passent en bas et celles du bas en haut.',
  dinoCorner: (d) =>
    d.slice
      ? `On tourne la tranche intérieure de ${DINO_CORNER_NAMES_FR[d.corner]} d’un tiers de tour (120°) dans le sens ${hands(d.clockwise)} d’une montre, vu depuis lui : six arêtes et six pétales tournent, entre les deux coupes de sa diagonale.`
      : `On tourne ${DINO_CORNER_NAMES_FR[d.corner]} d’un tiers de tour (120°) dans le sens ${hands(d.clockwise)} d’une montre, vu de face : ${d.master ? 'ses trois sommets voisins, ses trois arêtes, les trois centres autour et neuf pétales tournent avec lui' : d.skewb ? 'toute la moitié du puzzle de son côté tourne avec lui, ses trois sommets voisins et les trois centres autour' : d.rex ? 'ses trois arêtes, les trois centres autour et neuf pétales tournent avec lui' : 'ses trois arêtes tournent autour de lui'}.`,
  megaFace: (d) =>
    `On tourne ${MEGA_FACE_NAMES_FR[d.face]} ${Math.abs(d.fifths) === 1 ? 'd’un cinquième de tour (72°)' : 'de deux cinquièmes de tour (144°)'} dans le sens ${hands(d.fifths > 0)} d’une montre, vu de face : ${d.crystal ? 'ses cinq sommets, ses cinq arêtes et les cinq arêtes qui partent de ses sommets tournent avec elle' : 'son centre ne bouge pas, ses cinq arêtes et ses cinq sommets tournent autour'}.`,
  ftoFace: (d) =>
    d.slice
      ? `On tourne la tranche entre ${FTO_FACE_NAMES_FR[d.triangle]} et sa face opposée d’un tiers de tour (120°) dans le sens ${hands(d.clockwise)} d’une montre, vu depuis ${FTO_FACE_NAMES_FR[d.triangle]} : ses six arêtes et six centres tournent.`
      : `On tourne ${FTO_FACE_NAMES_FR[d.triangle]} d’un tiers de tour (120°) dans le sens ${hands(d.clockwise)} d’une montre, vu de face : ses neuf triangles tournent, avec trois sommets, trois arêtes et six centres des faces voisines.`,
  triangle: (d) =>
    `On tourne ${TRIANGLE_NAMES_FR[d.triangle]} d’un tiers de tour (120°) dans le sens ${hands(d.clockwise)} d’une montre, vu de face : ses trois pièces tournent autour de son centre, qui ne bouge pas.`,
  sectorSlash: () =>
    'Le pivot : toute la moitié droite du disque fait un demi-tour sur l’axe central, ses six pièces du haut passent en bas et celles du bas en haut, retournées.',
  sectorLayer: (d) => {
    const n = Math.abs(d.twelfths)
    const notches = n === 1 ? 'd’un cran' : `de ${n} crans`
    return `On tourne le disque ${d.layer === 'U' ? 'du haut' : 'du bas'} ${notches} (${30 * n}°) dans le sens ${hands(d.twelfths > 0)} d’une montre, vu de ${d.layer === 'U' ? 'dessus' : 'dessous'}.`
  },
  layers: (d) => {
    const face = FACE_NAMES_FR[d.face]
    const what = {
      block: `le bloc de la ${face} (toute sa colonne, ses paires debout ou couchées avec lui)`,
      half: `${HALF_NAMES_FR[d.face]} (tout ce qui est de ce côté de sa coupe)`,
      thin: `la couche fine de la ${face} seule`,
      inner: `la couche fine sous la ${face} seule`,
    }[d.layer]
    const how =
      d.turn === 'half'
        ? 'd’un demi-tour'
        : `d’un quart de tour dans le sens ${hands(d.turn === 'cw')} d’une montre, vu de ce côté`
    return `On tourne ${what} ${how}, si rien ne bloque sa coupe.`
  },
  copterEdge: (d) =>
    `On tourne l’arête ${COPTER_EDGE_FR[d.edge]} d’un demi-tour autour de son axe : elle pivote sur place, ses deux sommets s’échangent${d.iii ? ', avec les deux centres, six pétales et quatre feuilles autour' : ', avec les quatre feuilles autour'}.`,
  side: (d) =>
    `On retourne ${SIDE_NAMES_FR[d.side]} d’un demi-tour, autour de l’axe perpendiculaire à sa coupe : son arête se retourne, ses deux sommets s’échangent.`,
  pyra: (d) => {
    const corner = CORNER_NAMES_FR[d.vertex]
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
    }[d.part]
    return `On tourne ${target} d’un tiers de tour (120°) dans le sens ${hands(d.clockwise)} d’une montre, vu depuis ce sommet.`
  },
  ring: (d) => {
    const layer = STAR_LAYER_FR[d.ring]
    if (d.pieces === 3) {
      return `On tourne ${layer} de trois crans, soit un demi-tour : le sens n’a pas d’importance.`
    }
    const notches = d.pieces === 1 ? 'd’un cran' : 'de deux crans'
    const seen = fromAbove(d.ring) ? 'vu de dessus' : 'vu de dessous'
    return `On tourne ${layer} ${notches} (${60 * d.pieces}°) dans le sens ${hands(d.clockwise)} d’une montre, ${seen}.`
  },
}

/** « de » before a name: « du » before « le », « des » before « les ». */
const of = (name: string) =>
  name.startsWith('le ')
    ? `du ${name.slice(3)}`
    : name.startsWith('les ')
      ? `des ${name.slice(4)}`
      : `de ${name}`

/** A name with a comma in it closed by another (« du sommet du haut,
 *  devant à droite, d’un tiers de tour »). */
const closed = (name: string) => (name.includes(',') ? `${name},` : name)

const senseFr = (clockwise: boolean) =>
  clockwise ? 'dans le sens horaire' : 'dans le sens anti-horaire'

function cubeLayerShort(d: CubeLayer): string {
  const face = FACE_NAMES_FR[d.face]
  const what = {
    face: `de la ${face}`,
    middle: `de la tranche du milieu (parallèle à la ${face})`,
    slice: d.third
      ? `de la troisième couche depuis la ${face}`
      : `de la tranche interne voisine de la ${face}`,
    wide: d.halfPuzzle ? of(HALF_NAMES_FR[d.face]) : `de la ${face} et de sa tranche voisine`,
    whole: 'du cube entier',
  }[d.kind]
  if (d.turn === 'half') return `Rotation ${what} deux fois (demi-tour)`
  const seen = d.kind === 'face' ? 'en la regardant' : `vu depuis la ${face}`
  return `Rotation ${what} ${senseFr(d.turn === 'cw')}, ${seen}`
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
      ? `Trois demi-tours de suite de la ${FACE_NAMES_FR[d.face]}`
      : `Demi-tour de la ${FACE_NAMES_FR[d.face]} ${senseFr(d.clockwise)}, en la regardant`,
  slash: () => 'Demi-tour de la moitié droite (le slash)',
  dinoCorner: (d) => {
    const corner = DINO_CORNER_NAMES_FR[d.corner]
    const what = d.slice ? `de la tranche intérieure ${of(corner)}` : of(corner)
    return `Rotation ${closed(what)} d’un tiers de tour ${senseFr(d.clockwise)}, vu depuis lui`
  },
  megaFace: (d) =>
    `Rotation ${of(MEGA_FACE_NAMES_FR[d.face])} ${Math.abs(d.fifths) === 1 ? 'd’un cinquième de tour' : 'de deux cinquièmes de tour'} ${senseFr(d.fifths > 0)}, en la regardant`,
  ftoFace: (d) => {
    const face = FTO_FACE_NAMES_FR[d.triangle]
    return d.slice
      ? `Rotation de la tranche voisine ${of(face)} d’un tiers de tour ${senseFr(d.clockwise)}, vu depuis ${face}`
      : `Rotation ${of(face)} d’un tiers de tour ${senseFr(d.clockwise)}, en la regardant`
  },
  triangle: (d) =>
    `Rotation ${closed(of(TRIANGLE_NAMES_FR[d.triangle]))} d’un tiers de tour ${senseFr(d.clockwise)}, en le regardant`,
  sectorSlash: () => 'Demi-tour de la moitié droite du disque (le pivot)',
  sectorLayer: (d) => {
    const n = Math.abs(d.twelfths)
    return `Rotation du disque ${d.layer === 'U' ? 'du haut' : 'du bas'} ${n === 1 ? 'd’un cran' : `de ${n} crans`} ${senseFr(d.twelfths > 0)}, vu de ${d.layer === 'U' ? 'dessus' : 'dessous'}`
  },
  layers: (d) => {
    const face = FACE_NAMES_FR[d.face]
    const what = {
      block: `du bloc de la ${face}`,
      half: of(HALF_NAMES_FR[d.face]),
      thin: `de la couche fine de la ${face}`,
      inner: `de la couche fine sous la ${face}`,
    }[d.layer]
    return d.turn === 'half'
      ? `Demi-tour ${what}`
      : `Rotation ${what} ${senseFr(d.turn === 'cw')}, vu de ce côté`
  },
  copterEdge: (d) => `Demi-tour de l’arête ${COPTER_EDGE_FR[d.edge]} sur son axe`,
  side: (d) => `Demi-tour ${of(SIDE_NAMES_FR[d.side])}`,
  pyra: (d) => {
    const corner = CORNER_NAMES_FR[d.vertex]
    const what = {
      tip: `de la pointe du ${corner}`,
      corner: `de la couche du ${corner}`,
      half: `de la moitié du ${corner}`,
      slice: `de la ${{ 1: 'première', 2: 'deuxième', 3: 'troisième', 4: 'quatrième' }[d.slice ?? 1]} tranche du ${corner}`,
      opposite: `de la face opposée au ${corner}`,
    }[d.part]
    return `Rotation ${what} d’un tiers de tour ${senseFr(d.clockwise)}, vu depuis ce sommet`
  },
  ring: (d) => {
    const layer = of(STAR_LAYER_FR[d.ring])
    if (d.pieces === 3) return `Demi-tour ${layer} (trois crans)`
    const seen = fromAbove(d.ring) ? 'vu de dessus' : 'vu de dessous'
    return `Rotation ${layer} ${d.pieces === 1 ? 'd’un cran' : 'de deux crans'} ${senseFr(d.clockwise)}, ${seen}`
  },
}

/** The move guide's sentence for a turn. */
export const describeFr = (d: MoveDescription): string => sentenceOf(LONG, d)

/** A turn's short sentence (the tutorial's, beside its letters). */
export const describeShortFr = (d: MoveDescription): string => sentenceOf(SHORT, d)
