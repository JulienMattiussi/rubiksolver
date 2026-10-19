import type { MoveKind } from '../core/moveKind'
import { sameLayer, simplifyCubeMoves } from '../core/moves'
import {
  isCopterMove,
  isGearMove,
  isGhostMove,
  isMegaMove,
  isPuckMove,
  isPyraMove,
  isRainbowMove,
  isStarMove,
  type CopterMove,
  type GearMove,
  type GhostMove,
  type MegaMove,
  type Move,
  type PuckMove,
  type PyraMove,
  type PyraShape,
  type RainbowMove,
  type StarMove,
  type Turn,
  type Vec3,
} from '../core/types'
import { turnDims, cubeShape } from '../core/cube'
import {
  applyCopterMove,
  copterAxis,
  copterTurns,
  formatCopterMove,
  simplifyCopterMoves,
} from './diagonal/copter'
import {
  applyGhostMove,
  formatGhostMove,
  ghostAxis,
  ghostTurns,
  simplifyGhostMoves,
} from './flat/ghost'
import {
  applyGearMove,
  formatGearMove,
  gearSpinOf,
  gearFaceTurns,
  gearMovesCancel,
  gearRotation,
  gearSliceTurns,
  invertGearMove,
} from './gear/gear'
import {
  applyMegaMove,
  formatMegaMove,
  MEGA_AXES,
  invertMegaMove,
  megaRotation,
  megaTurns,
  simplifyMegaMoves,
} from './polyhedron/megaminx'
import {
  applyPyraMove,
  invertPyraMove,
  pyraRotation,
  isOppositeFace,
  pyraLayerOf,
  pyraSize,
  pyraTurns,
  samePyraLayer,
  simplifyPyraMoves,
} from './pyramid/pyraminx'
import { formatPyraMove } from './pyramid/pyraNotation'
import {
  applyPuckMove,
  formatPuckMove,
  invertPuckMove,
  puckRotation,
  puckTurns,
  simplifyPuckMoves,
} from './round/puck'
import {
  applyStarMove,
  formatStarMove,
  invertStarMove,
  signedPieces,
  simplifyStarMoves,
  starRotation,
  starTurns,
} from './round/star'
import {
  applyRainbowMove,
  formatRainbowMove,
  RAINBOW_CORNERS,
  invertRainbowMove,
  rainbowRotation,
  rainbowTurns,
  simplifyRainbowMoves,
} from './shared/rainbow'

/**
 * Every kind of move besides the cube's face turns, each from its puzzle's
 * module (see core/moveKind.ts). A new kind of move: its module's functions
 * gathered here, one entry.
 */

/** A kind turning the pieces its test says, by their places. */
const byPlace =
  <T extends Turn>(turns: (move: T, position: Vec3) => boolean) =>
  (cube: Parameters<MoveKind<T>['turned']>[0], move: T) =>
  (index: number) =>
    turns(move, cube[index]!.position)

const STAR: MoveKind<StarMove> = {
  is: isStarMove,
  format: formatStarMove,
  invert: invertStarMove,
  sameLayer: (a, b) =>
    'ring' in a && 'ring' in b ? a.ring === b.ring : 'slash' in a && 'slash' in b,
  simplify: simplifyStarMoves,
  turned: byPlace(starTurns),
  rotation: starRotation,
  apply: (cube, move) => applyStarMove(cube, move),
  // Its lower layers seen from below.
  sight: (move) =>
    'ring' in move && (move.ring === 'D' || move.ring === 'd')
      ? { kind: 'face', face: 'D' }
      : { kind: 'home' },
  describe: (move) => {
    if ('slash' in move) return { kind: 'slash' }
    const pieces = Math.abs(signedPieces(move)) as 1 | 2 | 3
    return { kind: 'ring', ring: move.ring, pieces, clockwise: move.amount <= 3 }
  },
}

const PYRA: MoveKind<PyraMove> = {
  is: isPyraMove,
  format: formatPyraMove,
  invert: invertPyraMove,
  sameLayer: samePyraLayer,
  simplify: simplifyPyraMoves,
  turned: (cube, move) => {
    const size = pyraSize(turnDims(cubeShape(cube)))
    return (index) => pyraTurns(move, cube[index]!.position, size)
  },
  rotation: pyraRotation,
  apply: (cube, move, mechanism) => applyPyraMove(cube, move, pyraSize(mechanism)),
  // A corner from its own side (the top one is in the home framing).
  sight: (move) =>
    move.vertex === 'U' ? { kind: 'home' } : { kind: 'around', axis: pyraRotation(move).axis },
  describe: (move, shape) => {
    const layer = pyraLayerOf(move)
    const kind =
      layer === 'tips'
        ? 'tip'
        : layer === 'corners'
          ? 'corner'
          : layer === 'deep'
            ? 'half'
            : isOppositeFace(shape as PyraShape, layer)
              ? 'opposite'
              : 'slice'
    const clockwise = move.amount === 1
    return { kind, vertex: move.vertex, clockwise, ...(move.slice && { slice: move.slice }) }
  },
}

/** A half turn: its own undo. */
const halfTurn = <T>(move: T) => move

const GHOST: MoveKind<GhostMove> = {
  is: isGhostMove,
  format: formatGhostMove,
  invert: halfTurn,
  sameLayer: (a, b) => a.side === b.side,
  simplify: simplifyGhostMoves,
  turned: byPlace(ghostTurns),
  rotation: (move) => ({ axis: ghostAxis(move.side), angle: Math.PI }),
  apply: (cube, move) => applyGhostMove(cube, move),
  // Its sides flip over in front of the home framing.
  sight: () => ({ kind: 'home' }),
  describe: (move) => ({ kind: 'side', side: move.side }),
}

const COPTER: MoveKind<CopterMove> = {
  is: isCopterMove,
  format: formatCopterMove,
  invert: halfTurn,
  sameLayer: (a, b) => a.edge === b.edge,
  simplify: simplifyCopterMoves,
  turned: byPlace(copterTurns),
  rotation: (move) => ({ axis: copterAxis(move.edge), angle: Math.PI }),
  apply: (cube, move) => applyCopterMove(cube, move),
  sight: (move) => ({ kind: 'beside', axis: copterAxis(move.edge) }),
  describe: (move) => ({ kind: 'copterEdge', edge: move.edge }),
}

const PUCK: MoveKind<PuckMove> = {
  is: isPuckMove,
  format: formatPuckMove,
  invert: invertPuckMove,
  sameLayer: (a, b) => ('flip' in a ? 'flip' in b : 'layer' in b && a.layer === b.layer),
  simplify: simplifyPuckMoves,
  turned: byPlace(puckTurns),
  rotation: puckRotation,
  apply: (cube, move) => applyPuckMove(cube, move),
  sight: () => ({ kind: 'home' }),
  describe: (move) => {
    if ('flip' in move) return { kind: 'puckSlash' }
    const twelfths = move.steps > 6 ? move.steps - 12 : move.steps
    return { kind: 'puckLayer', layer: move.layer, twelfths }
  },
}

const RAINBOW: MoveKind<RainbowMove> = {
  is: isRainbowMove,
  format: formatRainbowMove,
  invert: invertRainbowMove,
  sameLayer: (a, b) => a.triangle === b.triangle && !a.slice === !b.slice,
  simplify: simplifyRainbowMoves,
  turned: byPlace(rainbowTurns),
  rotation: rainbowRotation,
  apply: (cube, move) => applyRainbowMove(cube, move),
  sight: (move) => ({ kind: 'toward', direction: RAINBOW_CORNERS[move.triangle] }),
  describe: (move) => {
    const clockwise = move.amount === 1
    if (move.fto) {
      const base = { kind: 'ftoFace', triangle: move.triangle, clockwise } as const
      return move.slice ? { ...base, slice: true } : base
    }
    return move.dino
      ? {
          kind: 'dinoCorner',
          corner: move.triangle,
          clockwise,
          ...(move.rex && { rex: true as const }),
          ...(move.skewb && { skewb: true as const }),
          ...(move.master && { master: true as const }),
          ...(move.slice && { slice: true as const }),
        }
      : { kind: 'triangle', triangle: move.triangle, clockwise }
  },
}

const MEGA: MoveKind<MegaMove> = {
  is: isMegaMove,
  format: formatMegaMove,
  invert: invertMegaMove,
  sameLayer: (a, b) => a.megaFace === b.megaFace,
  simplify: simplifyMegaMoves,
  turned: byPlace(megaTurns),
  rotation: megaRotation,
  apply: (cube, move) => applyMegaMove(cube, move),
  sight: (move) => ({ kind: 'toward', direction: MEGA_AXES[move.megaFace] }),
  describe: (move) => {
    const fifths = move.amount <= 2 ? move.amount : move.amount - 5
    return { kind: 'megaFace', face: move.megaFace, fifths, ...(move.crystal && { crystal: true }) }
  },
}

/** The Gear Cube's (the Extreme mixes in plain top and bottom turns): a
 *  gear move and its inverse cancel, two the same way stay; the face turns
 *  among them merge as a cube's. */
const GEAR: MoveKind<GearMove | Move> = {
  is: isGearMove,
  format: (move, labels) => formatGearMove(move as GearMove, labels),
  invert: (move) => invertGearMove(move as GearMove),
  sameLayer: (a, b) => isGearMove(a) && isGearMove(b) && a.gear === b.gear,
  simplify: (moves) => {
    const out: (Move | GearMove)[] = []
    for (const move of moves) {
      const last = out[out.length - 1]
      if (isGearMove(move) || (last && isGearMove(last))) {
        if (last && isGearMove(last) && isGearMove(move) && gearMovesCancel(last, move)) out.pop()
        else out.push(move)
      } else if (last && sameLayer(last, move)) {
        out.pop()
        out.push(...simplifyCubeMoves([last, move]))
      } else out.push(move)
    }
    return out
  },
  turned: (cube, move) => (index) => gearFaceTurns(move as GearMove, cube[index]!.position),
  halfTurned: (cube, move) => (index) => gearSliceTurns(move as GearMove, cube[index]!.position),
  rotation: (move) => gearRotation(move as GearMove),
  apply: (cube, move) => applyGearMove(cube, move as GearMove),
  sight: (move) => ({ kind: 'face', face: (move as GearMove).gear }),
  spin: (move) => gearSpinOf(move as GearMove),
  describe: (move) => {
    const gear = move as GearMove
    const base = { kind: 'gear', face: gear.gear, clockwise: gear.amount === 1 } as const
    return gear.times ? { ...base, thrice: true } : base
  },
}

export const MOVE_KINDS: readonly MoveKind<Turn>[] = [
  STAR,
  PYRA,
  GHOST,
  COPTER,
  PUCK,
  RAINBOW,
  MEGA,
  GEAR,
]
