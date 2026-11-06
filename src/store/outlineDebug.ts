import { create } from 'zustand'
import type { P2 } from '@/lib/core/plane'
import type { OutlinesSeen, Picture } from '@/lib/editor/scan/outlines'

/**
 * A puzzle read by its outlines, debugged (`?scandebug`): what the reading
 * saw drawn over the picture it read, shown over the editor (OutlineDebug)
 * and downloaded. Blue, each piece's outline in the state read; green, its
 * sticker where it matched, its cost written in it; dashed orange, the
 * pose that came next in its slot, its cost below; magenta, the seams
 * found; red, the pentagon's corners. Above, how much worse the next best
 * state matched.
 */

interface OutlineDebug {
  /** The picture drawn, as a data URL, while shown. */
  image: string | undefined
  hide: () => void
}

export const useOutlineDebug = create<OutlineDebug>((set) => ({
  image: undefined,
  hide: () => set({ image: undefined }),
}))

/** Room above the picture, for the reading's confidence. */
const TOP = 28

const middleOf = (polygon: readonly P2[]): P2 => [
  polygon.reduce((s, p) => s + p[0], 0) / polygon.length,
  polygon.reduce((s, p) => s + p[1], 0) / polygon.length,
]

/** What a reading saw, drawn over its picture: shown and downloaded. */
export function showOutlines(picture: Picture, seen: OutlinesSeen | undefined, name: string) {
  const { width, height, light } = picture
  const canvas = Object.assign(document.createElement('canvas'), { width, height: height + TOP })
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const gray = new Uint8ClampedArray(4 * width * height)
  for (let i = 0; i < width * height; i++) {
    const l = Math.round(2.55 * light[i]!)
    gray.set([l, l, l, 255], 4 * i)
  }
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, width, TOP)
  ctx.putImageData(new ImageData(gray, width, height), 0, TOP)
  ctx.font = 'bold 16px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(seen ? `margin ${seen.margin.toFixed(3)}` : 'no pentagon', 8, 20)
  ctx.translate(0, TOP)
  const stroke = (polygon: readonly P2[], color: string, dashed = false) => {
    ctx.beginPath()
    polygon.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.closePath()
    ctx.setLineDash(dashed ? [6, 5] : [])
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
  }
  const dot = ([x, y]: P2, color: string, radius: number) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
  }
  const label = (text: string, [x, y]: P2, color: string) => {
    ctx.font = 'bold 13px sans-serif'
    const w = ctx.measureText(text).width
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(x - w / 2 - 2, y - 11, w + 4, 15)
    ctx.fillStyle = color
    ctx.fillText(text, x - w / 2, y)
  }
  if (seen) {
    for (const piece of seen.pieces) {
      stroke(piece.outline, '#3b82f6')
      if (piece.second) stroke(piece.second.sticker, '#f97316', true)
      stroke(piece.sticker, '#22c55e')
    }
    for (const { seen: at } of seen.seams) dot(at, '#d946ef', 1.5)
    for (const corner of seen.anchor.corners) dot(corner, '#ef4444', 3)
    for (const piece of seen.pieces) {
      const [x, y] = middleOf(piece.sticker)
      label(piece.cost.toFixed(2), [x, y], '#4ade80')
      if (piece.second) label(piece.second.cost.toFixed(2), [x, y + 16], '#fb923c')
    }
  }
  const image = canvas.toDataURL('image/png')
  useOutlineDebug.setState({ image })
  const link = document.createElement('a')
  link.href = image
  link.download = `${name}-seen-${Date.now()}.png`
  link.click()
}
