import * as THREE from 'three'

/**
 * The round emblem on the GEM-0's golden squares, as on the real puzzle: a
 * ring, a crown of short ticks inside it, and a cut gem in the middle, all
 * lightly engraved (a slightly darker gold) on a clear background, drawn
 * once.
 */

let picture: THREE.Texture | null = null

export function gemEmblemPicture(): THREE.Texture {
  if (picture) return picture
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  const c = size / 2
  // Engraved lightly: a gold a little darker than the square's.
  g.strokeStyle = '#a8843c'
  g.lineCap = 'round'
  g.lineJoin = 'round'
  // Two rings.
  for (const [r, w] of [
    [116, 6],
    [96, 3],
  ] as const) {
    g.lineWidth = w
    g.beginPath()
    g.arc(c, c, r, 0, 2 * Math.PI)
    g.stroke()
  }
  // A crown of ticks between them.
  g.lineWidth = 3
  for (let k = 0; k < 24; k++) {
    const t = (k / 24) * 2 * Math.PI
    g.beginPath()
    g.moveTo(c + Math.cos(t) * 100, c + Math.sin(t) * 100)
    g.lineTo(c + Math.cos(t) * 111, c + Math.sin(t) * 111)
    g.stroke()
  }
  // A cut gem: its table on top, its facets down to a point.
  const gem: [number, number][] = [
    [-52, -18],
    [-28, -46],
    [28, -46],
    [52, -18],
    [0, 56],
  ]
  g.lineWidth = 5
  g.beginPath()
  gem.forEach(([x, y], i) => (i ? g.lineTo(c + x, c + y) : g.moveTo(c + x, c + y)))
  g.closePath()
  g.stroke()
  g.lineWidth = 3
  for (const [[x1, y1], [x2, y2]] of [
    [
      [-52, -18],
      [52, -18],
    ],
    [
      [-28, -46],
      [-14, -18],
    ],
    [
      [28, -46],
      [14, -18],
    ],
    [
      [-14, -18],
      [0, 56],
    ],
    [
      [14, -18],
      [0, 56],
    ],
  ] as const) {
    g.beginPath()
    g.moveTo(c + x1, c + y1)
    g.lineTo(c + x2, c + y2)
    g.stroke()
  }
  picture = new THREE.CanvasTexture(canvas)
  picture.colorSpace = THREE.SRGBColorSpace
  return picture
}
