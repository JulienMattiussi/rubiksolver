import * as THREE from 'three'

/**
 * The Violet's logo, as on the real puzzle: a small yellow Pyraminx (a
 * triangle cut in nine, dark seams) with a red M over it (pointed peaks
 * out, curved legs in), drawn once on a
 * canvas, its background clear.
 */

let picture: THREE.Texture | null = null

export function violetLogoPicture(): THREE.Texture {
  if (picture) return picture
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  // The triangle: apex up, base along the bottom.
  const [left, right, apex] = [
    [28, 222],
    [228, 222],
    [128, 49],
  ] as const
  const at = (u: number, v: number): [number, number] => [
    left[0] + (right[0] - left[0]) * u + (apex[0] - left[0]) * v,
    left[1] + (right[1] - left[1]) * u + (apex[1] - left[1]) * v,
  ]
  g.beginPath()
  g.moveTo(...left)
  g.lineTo(...right)
  g.lineTo(...apex)
  g.closePath()
  g.fillStyle = '#facc15'
  g.fill()
  // Its seams: thirds along each side.
  g.strokeStyle = '#3b2a06'
  g.lineWidth = 6
  g.lineJoin = 'round'
  for (const k of [1 / 3, 2 / 3]) {
    for (const [a, b] of [
      [at(k, 0), at(0, k)],
      [at(k, 0), at(k, 1 - k)],
      [at(0, k), at(1 - k, k)],
    ]) {
      g.beginPath()
      g.moveTo(...a!)
      g.lineTo(...b!)
      g.stroke()
    }
  }
  g.beginPath()
  g.moveTo(...left)
  g.lineTo(...right)
  g.lineTo(...apex)
  g.closePath()
  g.stroke()
  // The M over it, stylized: pointed peaks spread out, its legs curving in
  // to their feet, its middle a sharp V; a light outline, then red.
  const m = () => {
    g.beginPath()
    g.moveTo(94, 214)
    g.quadraticCurveTo(54, 160, 58, 64)
    g.lineTo(128, 170)
    g.lineTo(198, 64)
    g.quadraticCurveTo(202, 160, 162, 214)
  }
  g.lineJoin = 'miter'
  g.miterLimit = 12
  g.lineCap = 'round'
  m()
  g.lineWidth = 36
  g.strokeStyle = '#fff7ed'
  g.stroke()
  m()
  g.lineWidth = 24
  g.strokeStyle = '#dc2626'
  g.stroke()
  picture = new THREE.CanvasTexture(canvas)
  picture.colorSpace = THREE.SRGBColorSpace
  return picture
}
