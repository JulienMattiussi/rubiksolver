import { Fragment, useState } from 'react'
import { cubeShape } from '@/lib/core/cube'
import { normalOfIndex } from '@/lib/core/geometry'
import type { Cubie } from '@/lib/core/types'
import { slotsFor } from '@/lib/editor/edit'
import { entersByPieces, stepOf, togglesAt, type TogglesSpec } from '@/lib/editor/entry'
import { canPaint } from '@/lib/editor/modes/colors'
import { stickerId, type Slot } from '@/lib/editor/editorTables'
import { piecesIn } from '@/lib/editor/modes/pieces'
import { splits, tileMates } from '@/lib/editor/modes/joints'
import { litSlots } from '@/lib/editor/modes/toggles'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX, EMPTY_COLOR } from './colors'
import { CutsView } from './CutsView'
import { FaceCanvases } from './FaceCanvases'
import { JointHandles } from './JointHandles'
import { Decal } from './Decal'
import { PolyPiece } from './PolyPiece'
import { polyDrawing } from './polyDrawing'

/** An empty border of a super cube's center: darker than an empty sticker. */
const EMPTY_BORDER = '#334155'

/** A slot as a toggle reads it. */
const toggleSlot = (slot: Slot) => ({ ...slot, stickers: slot.stickers.length })

/**
 * A puzzle drawn from polygons, in edit mode, as its entry's step says
 * (lib/editor/entry.ts): its faces on canvases, its half-cubies, or every
 * slot drawn as its piece, each visible sticker gray until painted and
 * clickable when the slot is paintable. While its joints are clicked, its
 * pieces are drawn plain, a click taking one apart; while toggles are set
 * (or painting, its own), a click turns what the slot says round, the
 * slots turning together lit up whole. Put piece by piece, each slot shows
 * the piece put there, and a click puts the next one. An inner point of
 * the 4-star shows its two sides only: once both are painted, their order
 * tells which way up it sits, and the editor completes its hidden face.
 */
export function PolyEditView() {
  const shape = useCube((s) => cubeShape(s.cube))
  const phase = useEditor((s) => s.phase)
  const edit = useEditor((s) => s.edit)
  const paintAt = useEditor((s) => s.paintAt)
  const cycleAt = useEditor((s) => s.cycleAt)
  const toggleAt = useEditor((s) => s.toggleAt)
  const toggles = useEditor((s) => s.toggles)
  const joints = useEditor((s) => s.joints)
  const split = useEditor((s) => s.split)
  // While a form is being chosen, the one hovered (the original otherwise).
  const form = useEditor((s) => (s.phase === 'form' ? s.preview : s.form))
  const drawing = polyDrawing(shape)
  const clickingJoints = phase === 'joints'
  const pieces = phase === 'paint' && entersByPieces(shape) ? piecesIn(edit, shape) : undefined
  // What a click turns round now: the toggles step's, or the paint's own.
  const turning: TogglesSpec | undefined = togglesAt(shape, phase)
  // The sticker under the pointer (its slot's key, then its normal index).
  const [hovered, setHovered] = useState<string | null>(null)
  const hover = (slotKey: string) => (ni: number, on: boolean) => {
    const key = `${slotKey}|${ni}`
    setHovered((current) => (on ? key : current === key ? null : current))
  }
  const litIn = (slotKey: string) =>
    hovered?.startsWith(`${slotKey}|`) ? Number(hovered.slice(slotKey.length + 1)) : null

  if (phase === 'canvas') return <FaceCanvases />
  const cuts = stepOf(shape, 'cuts')
  if (phase === 'cuts' && cuts) return <CutsView spec={cuts.cuts} drawing={drawing} />

  const slots = slotsFor(shape, form)
  // While a toggles step is set, the slots a click turns light up whole.
  const settingToggles = phase === 'toggles'
  const lit =
    settingToggles && turning
      ? litSlots(turning, slots.map(toggleSlot), hovered?.split('|')[0])
      : []
  /** The slot's key a click turns round, if it turns one. */
  const toggleKey = (slot: Slot) => turning?.keyAt(toggleSlot(slot)) ?? null

  /** The slot's piece as drawn: as solved (its geometry lists every
   *  sticker), turned as entered, then as its drawing says (`editLook`). */
  const lookOf = (slot: Slot): Cubie => {
    const turns = phase === 'paint' && toggleKey(slot) !== null
    const plain = {
      position: slot.position,
      stickers: slot.stickers.map((s) => ({ normal: s.normal, color: s.solvedColor })),
      ...(turns && { spin: toggles[slot.key] ?? 0 }),
    }
    if (!drawing.editLook) return plain
    const colors = slot.stickers.map((s) => edit[s.id])
    return drawing.editLook(plain, { colors, toggles, joints })
  }

  /** What a click on the slot does: split it while the joints are entered,
   *  turn it round while toggles are set (or the paint's own), or paint
   *  the sticker clicked. */
  const onSelectFor = (slot: Slot) => {
    if (clickingJoints) {
      if (!splits(shape, joints, slot.position)) return undefined
      return (ni: number, at: readonly number[]) =>
        split(slot.position, splitAxis(slot.position, ni, at))
    }
    if (toggleKey(slot)) return () => toggleAt(slot.key)
    if (settingToggles) return undefined
    if (canPaint(shape, slot.key, form)) return (ni: number) => paintAt(slot.key, ni)
    return undefined
  }

  return (
    <group rotation={[0, drawing.yaw, 0]}>
      <group quaternion={drawing.orient ?? [0, 0, 0, 1]} position={drawing.offset ?? [0, 0, 0]}>
        {slots.map((slot) => {
          const byNi = new Map(slot.stickers.map((s) => [s.ni, s.id]))
          const solved = lookOf(slot)
          if (pieces && slot.paintable && !toggleKey(slot)) {
            // Put piece by piece: the piece put, or the slot's own in gray
            // while empty; a click puts the next one.
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
            // as does a piece that never moves, put piece by piece (the
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
              onSelect={onSelectFor(slot)}
              onHover={hover(slot.key)}
              lit={settingToggles ? null : litIn(slot.key)}
              highlighted={lit.includes(slot.key)}
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
