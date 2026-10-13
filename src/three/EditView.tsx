import { useState } from 'react'
import { cubeDims, cubeShape } from '@/lib/cube'
import { canPaint, slotsFor } from '@/lib/editor'
import { centeringOffset, cubieBox, LAYER_THICKNESS } from '@/lib/shape'
import { gearAt } from '@/lib/gear'
import { hasColoredClips, isGear } from '@/lib/types'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX, MIRROR_STICKER, PLASTIC } from './colors'
import { CUBIE_GAP, cubeScale, visualPosition } from './layout'
import { Cubie } from './Cubie'
import { Sticker } from './Sticker'

/** Gray shown on a not-yet-painted sticker slot. */
export const EMPTY_COLOR = '#64748b'

/**
 * The cube in edit mode: every sticker is shown (gray when empty) and every
 * paintable one (any piece a turn moves or flips: `Slot.paintable`, read by
 * `canPaint`) is clickable to paint the selected value.
 *
 * On a mirror cube the value painted is a thickness, so a piece takes its
 * shape as it is painted: each axis grows to the thickness of the sticker
 * facing it, and an axis with nothing painted yet keeps a plain 1. Pieces only
 * ever grow outward (see lib/shape.ts), so a half-painted cube never overlaps.
 */
export function EditView() {
  const shape = useCube((s) => cubeShape(s.cube))
  const dims = useCube((s) => cubeDims(s.cube))
  const mirror = useCube((s) => s.variant === 'mirror')
  const edit = useEditor((s) => s.edit)
  // While a form is being chosen, the one hovered (the box otherwise).
  const form = useEditor((s) => (s.phase === 'form' ? s.preview : s.form))
  const paintAt = useEditor((s) => s.paintAt)
  const paintGearAt = useEditor((s) => s.paintGearAt)
  const gear = useEditor((s) => s.gear)
  const thickness = LAYER_THICKNESS[mirror ? 'mirror' : 'classic']
  const [ox, oy, oz] = centeringOffset(thickness)
  // The face under the pointer (its slot's key, then the face), lit up.
  const [hovered, setHovered] = useState<string | null>(null)
  const hover = (key: string) => (on: boolean) =>
    setHovered((current) => (on ? key : current === key ? null : current))
  const litIn = (slotKey: string) =>
    hovered?.startsWith(`${slotKey}|`) ? hovered.slice(slotKey.length + 1) : null
  if (isGear(shape)) {
    // A Gear Cube's own pieces, painted face by face (gears aligned). The
    // Ultimate's gears are painted apart from their clips; the plain one's
    // clips bear no color: its gears are the stickers.
    const clips = hasColoredClips(shape)
    return (
      <group scale={cubeScale(dims)}>
        {slotsFor(shape, form).map((slot) => {
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
                ...(edge && { spin: 0, ...(!clips && { plainClips: true as const }) }),
              }}
              dims={dims}
              variant="classic"
              smallCenter
              onHover={(face, on) => hover(`${slot.key}|${face}`)(on)}
              lit={litIn(slot.key)}
              colors={colors}
              onSelect={paintable && (clips || !edge) ? paintSticker : undefined}
              onSelectGear={
                clips ? (i) => paintGearAt(slot.key, slot.stickers[i]!.ni) : paintSticker
              }
              // Its gear's own colors, gray until painted.
              gearColors={
                clips
                  ? slot.stickers.map((s) => {
                      const color = gear[s.id]
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
  return (
    <group scale={cubeScale(dims)}>
      <group position={[ox, oy, oz]}>
        {slotsFor(shape, form).map((slot) => {
          const paintable = canPaint(shape, slot.key, form)
          const painted = slot.stickers.flatMap((s) => {
            const color = edit[s.id]
            return color ? [{ normal: s.normal, color }] : []
          })
          const { size: box, center } = cubieBox(painted, thickness)
          return (
            <group key={slot.key} position={visualPosition(slot.position, dims)}>
              <mesh position={[center[0], center[1], center[2]]}>
                <boxGeometry args={[box[0] - CUBIE_GAP, box[1] - CUBIE_GAP, box[2] - CUBIE_GAP]} />
                <meshStandardMaterial color={PLASTIC} roughness={0.65} metalness={0.1} />
              </mesh>
              {slot.stickers.map((s) => {
                const color = edit[s.id]
                return (
                  <Sticker
                    key={s.id}
                    normal={s.normal}
                    color={color ? (mirror ? MIRROR_STICKER : COLOR_HEX[color]) : EMPTY_COLOR}
                    box={{ size: box, center }}
                    metal={mirror && color !== undefined}
                    onSelect={paintable ? () => paintAt(slot.key, s.ni) : undefined}
                    onHover={hover(`${slot.key}|${s.ni}`)}
                    lit={hovered === `${slot.key}|${s.ni}`}
                  />
                )
              })}
            </group>
          )
        })}
      </group>
    </group>
  )
}
