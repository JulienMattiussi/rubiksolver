import { useState } from 'react'
import { cubeDims, cubeShape } from '@/lib/core/cube'
import { slotsFor } from '@/lib/editor/edit'
import { canPaint } from '@/lib/editor/modes/colors'
import { entryOf, togglesAt } from '@/lib/editor/entry'
import { litSlots } from '@/lib/editor/modes/toggles'
import { gearAt } from '@/lib/puzzles/gear/gear'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX, EMPTY_COLOR } from '@/three/core/colors'
import { cubeScale } from '@/three/core/layout'
import { Cubie } from '@/three/core/Cubie'
import { GearPiece } from './GearPiece'

/**
 * A Gear Cube in edit mode, its own pieces: its gears pivoted as set
 * first (its toggles step: a click pivots one, its slice's with it, lit
 * up together), then painted face by face. The Ultimate's gears are
 * painted apart from their clips (its paint's parts); the plain one's
 * clips bear no color: its gears are the stickers.
 */
export function GearEditView() {
  const shape = useCube((s) => cubeShape(s.cube))
  const dims = useCube((s) => cubeDims(s.cube))
  const edit = useEditor((s) => s.edit)
  const form = useEditor((s) => s.form)
  const paintAt = useEditor((s) => s.paintAt)
  const paintPartAt = useEditor((s) => s.paintPartAt)
  const parts = useEditor((s) => s.parts)
  const toggles = useEditor((s) => s.toggles)
  const toggleAt = useEditor((s) => s.toggleAt)
  const pivots = useEditor((s) => togglesAt(shape, s.phase))
  // The face under the pointer (its slot's key, then the face), lit up.
  const [hovered, setHovered] = useState<string | null>(null)
  const hover = (key: string) => (on: boolean) =>
    setHovered((current) => (on ? key : current === key ? null : current))
  const litIn = (slotKey: string) =>
    hovered?.startsWith(`${slotKey}|`) ? hovered.slice(slotKey.length + 1) : null
  const slots = slotsFor(shape, form)
  const pivoting = pivots
    ? litSlots(
        pivots,
        slots.map((s) => ({ ...s, stickers: s.stickers.length })),
        hovered?.split('|')[0],
      )
    : []
  const clips = entryOf(shape).paint.parts !== undefined
  return (
    <group scale={cubeScale(dims)}>
      {slots.map((slot) => {
        const paintable = canPaint(shape, slot.key, form)
        // A gear's slot (not the Extreme's middle edges, plain blocks).
        const edge = gearAt(shape, slot.position)
        const colors = slot.stickers.map((s) => {
          const color = edit[s.id]
          return color ? COLOR_HEX[color] : EMPTY_COLOR
        })
        const paintSticker = (i: number) => paintAt(slot.key, slot.stickers[i]!.ni)
        return (
          <Cubie
            key={slot.key}
            cubie={{
              position: slot.position,
              stickers: slot.stickers.map((s) => ({ normal: s.normal, color: s.solvedColor })),
              ...(edge && {
                spin: toggles[slot.key] ?? 0,
                ...(!clips && { plainClips: true as const }),
              }),
            }}
            dims={dims}
            variant="classic"
            own={GearPiece}
            onHover={(face, on) => hover(`${slot.key}|${face}`)(on)}
            lit={pivots ? null : litIn(slot.key)}
            highlighted={edge && pivoting.includes(slot.key)}
            colors={colors}
            onSelect={!pivots && paintable && (clips || !edge) ? paintSticker : undefined}
            onSelectGear={
              pivots
                ? () => toggleAt(slot.key)
                : clips
                  ? (i) => paintPartAt(slot.key, slot.stickers[i]!.ni)
                  : paintSticker
            }
            // Its gear's own colors, gray until painted.
            gearColors={
              clips
                ? slot.stickers.map((s) => {
                    const color = parts[s.id]
                    return color ? COLOR_HEX[color] : EMPTY_COLOR
                  })
                : colors
            }
          />
        )
      })}
    </group>
  )
}
