import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { otherFace, watch, watchAfter } from '@/lib/editor/scan/capture'
import { labOf } from '@/lib/editor/scan/color'
import { frameOnScreen, screenToPicture } from '@/lib/editor/scan/frame'
import { anchorInMark, type Picture } from '@/lib/editor/scan/outlines'
import { cubeShape } from '@/lib/core/cube'
import type { Color } from '@/lib/core/types'
import { useCube } from '@/store/cubeStore'
import { savePicture } from '@/store/scanDebug'
import type { Kept } from '@/store/scanStore'
import type { FaceImage } from '@/workers/findStickers'
import type { ScanFace } from '@/lib/editor/scan/plan'
import type { Rect } from '@/lib/editor/scan/sized'
import { sampleFace, type CellSample } from '@/lib/editor/scan/sample'

/** How often the picture is read, in milliseconds. */
const READ_MS = 100
/** Pixels across the picture of a frame the cells are read on. */
const FRAME_PX = 192
/** How long a face is waited for once the user said it is there. */
const ARMED_MS = 5000

/** A picture's lightness, pixel by pixel (a face read whole). */
function lightOf({ width, height, ...pixels }: ImageData | FaceImage): Picture {
  const data = 'data' in pixels ? pixels.data : pixels.rgba
  const light = new Float32Array(width * height)
  for (let i = 0; i < light.length; i++)
    light[i] = labOf(data[4 * i]!, data[4 * i + 1]!, data[4 * i + 2]!)[0]
  return { width, height, light }
}

/** Pixels across the image a mirror's face is kept in: its stickers found
 *  on it (stickersWorker.ts), a thin one some 25 pixels wide; and a face
 *  read whole (outlines.ts), its black frames some 15 pixels wide. */
const SHARP_PX = 480

/** Room kept round the frame of a face read as canvases, a share of its
 *  side each way (the camera's picture allowing): its stickers are read
 *  past the frame too (a puzzle held a little off it, or near). */
const CANVAS_ROOM = 0.15

/** The frame's image, sharp enough to find a mirror's stickers on, `room`
 *  round it (a share of its side each way, as far as the picture goes),
 *  and where the frame lies in it. */
function imageOf(
  video: HTMLVideoElement,
  crop: { x: number; y: number; width: number; height: number },
  canvas: HTMLCanvasElement,
  room = 0,
): { image: FaceImage; frame: Rect } | undefined {
  // Along one axis: the frame from `from`, `size` long, grown by the room
  // the picture has on either side.
  const grown = (from: number, size: number, limit: number) => {
    const before = Math.max(0, Math.min(from, room * size))
    const after = Math.max(0, Math.min(limit - from - size, room * size))
    return [from - before, size + before + after] as const
  }
  const [cx, cw] = grown(crop.x, crop.width, video.videoWidth)
  const [cy, ch] = grown(crop.y, crop.height, video.videoHeight)
  const scale = SHARP_PX / crop.width
  const [width, height] = [Math.round(cw * scale), Math.round(ch * scale)]
  Object.assign(canvas, { width, height })
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return undefined
  ctx.drawImage(video, cx, cy, cw, ch, 0, 0, width, height)
  return {
    image: { width, height, rgba: ctx.getImageData(0, 0, width, height).data },
    frame: [(crop.x - cx) * scale, (crop.y - cy) * scale, crop.width * scale, crop.height * scale],
  }
}

/**
 * A face read from the camera (ScanView): nothing until the user says the
 * puzzle is in the frame (`arm`, a tap: nothing else tells a puzzle from a
 * wall); then, while `aiming`, the frame (between `top` and `bottom`
 * pixels of the screen) read ten times a second, its cells shown, and the
 * face handed to `take` once it held still (capture.ts), a tap again for
 * the next. Nothing held still in time: `nothing`, a tap again.
 */
export function useFaceReading({
  videoRef,
  face,
  top,
  bottom,
  aiming,
  last,
  take,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  face: ScanFace
  top: number
  bottom: number
  aiming: boolean
  /** The face taken before, not to take again before the puzzle turns. */
  last: readonly CellSample[] | undefined
  /** The face taken, and what is kept of it: its photo (to show it again,
   *  should it be refused); on a face read whole, its lightness; on a
   *  mirror's, its image. */
  take: (cells: readonly CellSample[], kept: Kept) => void
}) {
  const [armed, setArmed] = useState(false)
  const [nothing, setNothing] = useState(false)
  // The center last shown instead of the face asked for, and once nothing
  // held still in time, the one to say.
  const other = useRef<Color | null>(null)
  const [wrong, setWrong] = useState<Color | null>(null)
  const [holding, setHolding] = useState(false)
  const [cells, setCells] = useState<readonly CellSample[]>([])
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const wide = useRef<HTMLCanvasElement | null>(null)

  const arm = useCallback(() => {
    setNothing(false)
    setWrong(null)
    other.current = null
    setArmed(true)
  }, [])
  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => {
      setArmed(false)
      setNothing(true)
      setWrong(other.current)
    }, ARMED_MS)
    return () => clearTimeout(timer)
  }, [armed])

  useEffect(() => {
    if (!aiming || !armed) return
    // Watched from the tap on, the shake of the tap left out.
    let watched = watchAfter(last)
    const timer = setInterval(() => {
      const video = videoRef.current
      if (!video?.videoWidth) return
      const view = { width: video.clientWidth, height: video.clientHeight }
      const crop = screenToPicture(frameOnScreen(view, face, top, bottom), view, {
        width: video.videoWidth,
        height: video.videoHeight,
      })
      canvas.current ??= document.createElement('canvas')
      const [width, height] = [FRAME_PX, Math.round((FRAME_PX * face.height) / face.width)]
      Object.assign(canvas.current, { width, height })
      const ctx = canvas.current.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height)
      const frame = ctx.getImageData(0, 0, width, height)
      const read = sampleFace(frame, face)
      setCells(read)
      other.current = otherFace(read, face)
      // A face read whole: taken only once its anchor lies in its mark.
      if (face.whole && !anchorInMark(face.whole, lightOf(frame))) {
        watched = watchAfter(last)
        setHolding(false)
        return
      }
      const seen = watch(watched, read, performance.now(), face)
      watched = seen.state
      setHolding(watched.frames.length > 1)
      if (seen.taken) {
        // A tap again for the next face.
        setArmed(false)
        const sharp =
          face.sized || face.whole
            ? imageOf(
                video,
                crop,
                (wide.current ??= document.createElement('canvas')),
                face.canvas ? CANVAS_ROOM : 0,
              )
            : undefined
        // A face read whole: the sharp picture's lightness, saved to
        // replay its reading (`?scandebug`).
        const light = face.whole && sharp ? lightOf(sharp.image) : undefined
        if (face.whole && wide.current)
          savePicture(wide.current, `scan-${cubeShape(useCube.getState().cube)}`)
        take(seen.taken, {
          photo: canvas.current.toDataURL('image/jpeg', 0.8),
          light,
          image: face.sized ? sharp?.image : undefined,
          ...(face.canvas && sharp && { frame: sharp.frame }),
        })
      }
    }, READ_MS)
    return () => {
      clearInterval(timer)
      setHolding(false)
      setCells([])
    }
  }, [aiming, armed, face, top, bottom, last, take, videoRef])

  return { armed, nothing, wrong, arm, holding, cells }
}
