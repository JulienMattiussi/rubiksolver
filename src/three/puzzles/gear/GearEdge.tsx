import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Cubie } from '@/lib/core/types'
import type { PieceTone } from '@/three/core/Cubie'
import { COLOR_HEX, PLASTIC } from '../../core/colors'
import { pieceBody } from './gearFace'
import { GearBody } from './GearBody'
import { partTone, selectable } from './pieceTone'
import { GearPlate } from './GearPlate'

/**
 * A Gear Cube's edge (see lib/puzzles/gear/gear.ts): its gear, a plate on each of its two
 * faces cut to the agreed shape (gearFace.ts), which spins about the edge's
 * axis (from the cube's center through the edge) five sixths of a turn per step,
 * so away from home it leaves the cube askew, its black body (its outline
 * pushed into the cube) with it; and
 * its two clips (fan2cube's
 * "agrafes"), a U by the center of each of its faces in its base's color,
 * which turn with the piece, not with the gear. In edit mode, as a corner
 * (GearCorner): `colors` and `onSelect` for its clips, `gearColors` and
 * `onSelectGear` for its gear; in the tutorial, a click picks the piece.
 */
export function GearEdge({
  cubie,
  tone,
  spinning = 0,
  progress,
  colors,
  onSelect,
  onSelectGear,
  gearColors,
  onHover,
  lit,
}: {
  cubie: Cubie
  tone: PieceTone
  spinning?: number
  progress?: RefObject<number>
  colors?: readonly string[]
  onSelect?: (sticker: number) => void
  /** In edit mode, a click on a face of the gear itself, and its colors
   *  (painted apart from its clips'). */
  onSelectGear?: (sticker: number) => void
  gearColors?: readonly string[]
  /** As a corner's (GearCorner); a gear's faces are `g` and the index. */
  onHover?: (face: string, on: boolean) => void
  lit?: string | null
}) {
  const color = (i: number) => colors?.[i] ?? COLOR_HEX[cubie.stickers[i]!.color]
  const hover = (face: string) => onHover && ((on: boolean) => onHover(face, on))
  const click = (i: number) => selectable(tone, onSelect && (() => onSelect(i)), hover(`${i}`))
  const clickGear = (i: number) =>
    selectable(tone, onSelectGear && (() => onSelectGear(i)), hover(`g${i}`))
  // A word naming one part (its gear, or its clips) lights it alone.
  const clipsTone = partTone(tone, 'clips')
  const gearTone = partTone(tone, 'gear')
  const gear = useRef<THREE.Group>(null)
  const axis = new THREE.Vector3(...cubie.position).normalize()

  useFrame(() => {
    const t = spinning ? (progress?.current ?? 0) : 0
    gear.current?.setRotationFromAxisAngle(axis, ((cubie.spin! + spinning * t) * Math.PI) / 3)
  })

  return (
    <>
      {cubie.stickers.map((s, i) => (
        <GearBody
          key={`clipBody${i}`}
          geometry={pieceBody('clip', cubie.position, s.normal)}
          tone={clipsTone}
          select={click(i)}
        />
      ))}
      {cubie.stickers.map((s, i) => (
        <GearPlate
          key={i}
          kind="clip"
          position={cubie.position}
          normal={s.normal}
          // Plain clips (the plain Gear Cube) bear no color.
          color={cubie.plainClips ? PLASTIC : color(i)}
          tone={clipsTone}
          lit={lit === `${i}`}
        />
      ))}
      <group ref={gear}>
        {/* Its black body: its outline pushed into the cube under each of
            its faces, so it follows the teeth whatever its spin. */}
        {cubie.stickers.map((s, i) => (
          <GearBody
            key={`body${i}`}
            geometry={pieceBody('gear', cubie.position, s.normal)}
            tone={gearTone}
            select={clickGear(i)}
          />
        ))}
        {cubie.stickers.map((s, i) => (
          <GearPlate
            key={i}
            kind="gear"
            position={cubie.position}
            normal={s.normal}
            color={gearColors?.[i] ?? color(i)}
            tone={gearTone}
            lift={0.006}
            lit={lit === `g${i}`}
          />
        ))}
      </group>
    </>
  )
}
