import { Fragment, useState } from 'react'
import { cubeShape } from '@/lib/core/cube'
import { normalOfIndex } from '@/lib/core/geometry'
import type { Cubie } from '@/lib/core/types'
import { canPaint, slotsFor } from '@/lib/editor/editor'
import { stickerId, type Slot } from '@/lib/editor/editorTables'
import { entersByPieces, piecesIn } from '@/lib/editor/pieceEditor'
import { splits, tileMates } from '@/lib/editor/jointsEditor'
import { cutPieces } from '@/lib/editor/cutsEditor'
import { faceKeyAt } from '@/lib/puzzles/bandaged/roadblock'
import { isBarCenter, setupTargets } from '@/lib/editor/setup'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX } from './colors'
import { EMPTY_COLOR } from './EditView'
import { JointHandles } from './JointHandles'
import { Decal } from './Decal'
import { PolyPiece } from './PolyPiece'
import { polyDrawing } from './polyDrawing'

/** An empty border of a super cube's center: darker than an empty sticker. */
const EMPTY_BORDER = '#334155'

/**
 * A gridless puzzle in edit mode: every slot drawn as its piece, each visible
 * sticker gray until painted and clickable when the slot is paintable (on a
 * star prism, all but the left screw half, which never moves). An inner
 * point of the 4-star shows its two sides only: once both are painted, their
 * order tells which way up it sits, and the editor completes its hidden face.
 * The Floppy Ghost and the Z-Twist are entered piece by piece: each slot
 * shows the piece put there, and a click puts the next one (pieceEditor.ts);
 * a click on a Z-Twist side center turns it a quarter. A RoadBlock-I's
 * centers are drawn as their bars lie; while its bars are set, a click on
 * a center turns its face's a quarter. A bandaged puzzle's pieces are
 * fused as solved.
 */
export function PolyEditView() {
  const shape = useCube((s) => cubeShape(s.cube))
  const edit = useEditor((s) => s.edit)
  const paintAt = useEditor((s) => s.paintAt)
  const cycleAt = useEditor((s) => s.cycleAt)
  const twistAt = useEditor((s) => s.twistAt)
  const twisted = useEditor((s) => s.twisted)
  const joints = useEditor((s) => s.joints)
  // A bandaged puzzle's joints being clicked: its pieces drawn plain.
  const clickingJoints = useEditor((s) => s.phase === 'joints')
  const split = useEditor((s) => s.split)
  // A RoadBlock-I's bars being set: its centers turn them, by face.
  const clickingBars = useEditor((s) => s.phase === 'bars')
  const turnBarsAt = useEditor((s) => s.turnBarsAt)
  // While a form is being chosen, the one hovered (the original otherwise).
  const form = useEditor((s) => (s.phase === 'form' ? s.preview : s.form))
  const drawing = polyDrawing(shape)
  const pieces = entersByPieces(shape) ? piecesIn(edit, shape) : undefined
  // The sticker under the pointer (its slot's key, then its normal index).
  const [hovered, setHovered] = useState<string | null>(null)
  const hover = (slotKey: string) => (ni: number, on: boolean) => {
    const key = `${slotKey}|${ni}`
    setHovered((current) => (on ? key : current === key ? null : current))
  }
  const litIn = (slotKey: string) =>
    hovered?.startsWith(`${slotKey}|`) ? Number(hovered.slice(slotKey.length + 1)) : null
  const clickingCuts = useEditor((s) => s.phase === 'cuts')
  const cuts = useEditor((s) => s.cuts)
  const cutAt = useEditor((s) => s.cutAt)
  // The cell under the pointer: its halves light up together.
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  // While the bars are set, the face a click turns lights up whole.
  const hoveredSlot = hovered?.split('|')[0]
  const barsLit =
    clickingBars && hoveredSlot && isBarCenter(hoveredSlot.split(',').map(Number))
      ? setupTargets('bars', shape, hoveredSlot)
      : []

  /** A Z-Twist side center, a Quarter Cube's: a click turns it a quarter,
   *  or back. */
  const turnsOnClick = (slot: Slot) =>
    slot.stickers.length === 1 && !!drawing.editTurns?.(slot.position)

  /** The slot's piece as drawn: as solved (its geometry lists every
   *  sticker), turned as entered, then as its drawing says (`editLook`). */
  const lookOf = (slot: Slot, turns: boolean): Cubie => {
    const plain = {
      position: slot.position,
      stickers: slot.stickers.map((s) => ({ normal: s.normal, color: s.solvedColor })),
      ...(turns && { spin: twisted.includes(slot.key) ? 1 : 0 }),
    }
    if (!drawing.editLook) return plain
    const colors = slot.stickers.map((s) => edit[s.id])
    return drawing.editLook(plain, { colors, twisted, joints })
  }

  /** What a click on the slot does: split it while the joints are entered,
   *  turn its face's bars while they are set, turn it, or paint the sticker
   *  clicked. */
  const onSelectFor = (slot: Slot, turns: boolean) => {
    if (clickingBars) {
      return isBarCenter(slot.position) ? () => turnBarsAt(faceKeyAt(slot.position)) : undefined
    }
    if (clickingJoints) {
      if (!splits(shape, joints, slot.position)) return undefined
      return (ni: number, at: readonly number[]) =>
        split(slot.position, splitAxis(slot.position, ni, at))
    }
    if (turns) return () => twistAt(slot.key)
    if (canPaint(shape, slot.key, form)) return (ni: number) => paintAt(slot.key, ni)
    return undefined
  }

  // The Fashion-V's halves being placed: drawn as its cells say, gray but
  // its centers (which never move); a click turns a cell's halves round.
  if (clickingCuts) {
    return (
      <group rotation={[0, drawing.yaw, 0]}>
        {cutPieces(cuts).map((c) => {
          const cell = c.position.map(Math.sign).join()
          const center = c.position.filter((v) => v !== 0).length === 1
          return (
            <PolyPiece
              key={c.position.join()}
              cubie={c}
              drawing={drawing}
              stickerHex={center ? undefined : () => EMPTY_COLOR}
              onSelect={center ? undefined : () => cutAt(cell)}
              onHover={
                center
                  ? undefined
                  : (_, on) =>
                      setHoveredCell((current) => (on ? cell : current === cell ? null : current))
              }
              highlighted={hoveredCell === cell}
            />
          )
        })}
      </group>
    )
  }
  return (
    <group rotation={[0, drawing.yaw, 0]}>
      <group quaternion={drawing.orient ?? [0, 0, 0, 1]} position={drawing.offset ?? [0, 0, 0]}>
        {slotsFor(shape, form).map((slot) => {
          const byNi = new Map(slot.stickers.map((s) => [s.ni, s.id]))
          const turns = turnsOnClick(slot)
          const solved = lookOf(slot, turns)
          if (pieces && slot.paintable) {
            // Entered piece by piece: the piece placed, or the slot's own in
            // gray while empty; a click puts the next one.
            const placed = pieces.get(slot.key)
            return (
              <Fragment key={slot.key}>
                <PolyPiece
                  cubie={placed ?? solved}
                  drawing={drawing}
                  stickerHex={placed ? undefined : () => EMPTY_COLOR}
                  onSelect={() => cycleAt(slot.key)}
                  onHover={hover(slot.key)}
                  lit={litIn(slot.key)}
                />
                {/* Its picture too (the Hockey Puck's numbers tell its pairs apart). */}
                {placed && drawing.decal?.on(0, placed) && (
                  <Decal cubie={placed} decal={drawing.decal} />
                )}
              </Fragment>
            )
          }
          const borders = new Set(
            slot.stickers
              .filter(
                (s) =>
                  drawing.editBorders &&
                  s.normal.reduce((sum, v, d) => sum + v * slot.position[d]!, 0) !==
                    Math.max(...slot.position.map(Math.abs)),
              )
              .map((s) => s.ni),
          )
          const hex = (ni: number) => {
            // While the joints are entered, only the pieces that never move
            // show their colors (pre-filled), and the tiles they are part of.
            if (clickingJoints && slot.paintable) {
              if (!byNi.has(ni)) return undefined
              const fixed = tileMates(joints, slot.position, normalOfIndex(ni)).find(
                (mate) => !canPaint(shape, mate.join(','), form),
              )
              const color = fixed && edit[stickerId(fixed, ni)]
              return color ? COLOR_HEX[color] : EMPTY_COLOR
            }
            // A face with no sticker to enter keeps its own (the Purple's),
            // as does a piece that never moves, entered piece by piece (the
            // Z-Twist's centers).
            if (!byNi.has(ni) || (pieces && !slot.paintable)) return undefined
            const color = edit[byNi.get(ni)!]
            if (color) return drawing.skin ?? COLOR_HEX[color]
            // A super cube's border, darker while empty: it shows where to paint.
            return borders.has(ni) ? EMPTY_BORDER : EMPTY_COLOR
          }
          return (
            <PolyPiece
              key={slot.key}
              cubie={solved}
              drawing={drawing}
              stickerHex={hex}
              onSelect={onSelectFor(slot, turns)}
              onHover={hover(slot.key)}
              lit={clickingBars ? null : litIn(slot.key)}
              highlighted={barsLit.includes(slot.key)}
            />
          )
        })}
        {clickingJoints && <JointHandles shape={shape} />}
      </group>
    </group>
  )
}

/** The axis a 2x2 is cut across, from where its sticker of normal index
 *  `ni` was clicked: the cut runs along the border of the clicked cell
 *  nearest the click, so the cells part along the axis of the face the
 *  click is farthest along. */
function splitAxis(cell: readonly number[], ni: number, at: readonly number[]): number {
  const face = normalOfIndex(ni).findIndex((v) => v !== 0)
  const [u, v] = [0, 1, 2].filter((d) => d !== face) as [number, number]
  return Math.abs(at[u]! - cell[u]!) >= Math.abs(at[v]! - cell[v]!) ? u : v
}
