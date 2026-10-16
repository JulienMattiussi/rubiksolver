import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'

/** Pulses a second, and how low and high the glow goes. */
const RATE = 1.4
const LOW = 0.15
const HIGH = 1.1

/**
 * A material's glow, steady (`steady`) or, while `on`, pulsing: a piece
 * the tutorial points at shimmers, its body and stickers, so it shows
 * even where its glow is the color of its stickers (amber around yellow).
 */
export function usePulse(on: boolean, steady: number) {
  const ref = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    const material = ref.current
    if (!material) return
    const wave = 0.5 + 0.5 * Math.sin(clock.elapsedTime * RATE * 2 * Math.PI)
    material.emissiveIntensity = on ? LOW + (HIGH - LOW) * wave : steady
  })
  return ref
}
