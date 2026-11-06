import * as THREE from 'three'

/** Fine lines along a lenticular sticker's ridges (of a 128-pixel tile),
 *  faint over its color; bold where their way is entered. */
const TILE = 128
const LINES = 12
const FAINT = { color: 'rgba(15, 23, 42, 0.3)', width: 2 }
const BOLD = { color: 'rgba(15, 23, 42, 0.75)', width: 4 }

const textures = new Map<string, THREE.CanvasTexture>()

/** The ridges drawn over a lenticular sticker, up its plane (`upright`:
 *  along its own y axis) or across it, faint or bold. One texture each,
 *  made on first use. */
export function ridgesTexture(upright: boolean, bold = false): THREE.Texture {
  const key = `${upright}${bold}`
  let texture = textures.get(key)
  if (texture) return texture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = TILE
  const g = canvas.getContext('2d')!
  const line = bold ? BOLD : FAINT
  g.strokeStyle = line.color
  g.lineWidth = line.width
  for (let i = 0; i < LINES; i++) {
    const at = ((i + 0.5) * TILE) / LINES
    g.beginPath()
    if (upright) {
      g.moveTo(at, 0)
      g.lineTo(at, TILE)
    } else {
      g.moveTo(0, at)
      g.lineTo(TILE, at)
    }
    g.stroke()
  }
  texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  textures.set(key, texture)
  return texture
}
