import * as THREE from 'three'

/** Stripes across a sticker, and their width (of a 128-pixel tile). */
const PERIOD = 48
const WIDTH = 14
const TILE = 128

let texture: THREE.CanvasTexture | null = null

/** The hatching laid over a sticker (its color shows between dark
 *  diagonal stripes, see `HATCH`): one texture, made on first use. */
export function hatchTexture(): THREE.CanvasTexture {
  if (texture) return texture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = TILE
  const g = canvas.getContext('2d')!
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, TILE, TILE)
  g.strokeStyle = '#334155'
  g.lineWidth = WIDTH
  for (let x = -TILE; x <= 2 * TILE; x += PERIOD) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x + TILE, TILE)
    g.stroke()
  }
  texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
