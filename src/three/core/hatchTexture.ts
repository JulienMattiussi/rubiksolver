import * as THREE from 'three'

/** Stripes across a sticker, and their width (of a 128-pixel tile): three
 *  to a tile exactly, so that tiles side by side (a polygon wider than one)
 *  carry the stripes on without a seam. */
const TILE = 128
const PERIOD = TILE / 3
const WIDTH = 14

let texture: THREE.CanvasTexture | null = null
const repeated = new Map<number, THREE.Texture>()

/** The hatching laid over a sticker (its color shows between dark
 *  diagonal stripes): a tutorial's pieces that move but are not placed yet
 *  (a formula's, see lib/teach/tutorial.ts). One texture, made on first
 *  use; `repeat` times over a surface whose texture spans that many
 *  stickers (a Gear Cube's plate spans its face: 3), the stripes then as
 *  fine as a sticker's. */
export function hatchTexture(repeat = 1): THREE.Texture {
  if (repeat !== 1) {
    let tiled = repeated.get(repeat)
    if (!tiled) {
      tiled = hatchTexture().clone()
      tiled.repeat.set(repeat, repeat)
      tiled.needsUpdate = true
      repeated.set(repeat, tiled)
    }
    return tiled
  }
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
    // Past the tile's edges: no gap where a stroke would stop short.
    g.moveTo(x - WIDTH, -WIDTH)
    g.lineTo(x + TILE + WIDTH, TILE + WIDTH)
    g.stroke()
  }
  texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  // Repeated over a polygon wider than a tile (a puzzle drawn in polygons).
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}
