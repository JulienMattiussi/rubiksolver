import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { watch, watchAfter } from '@/lib/editor/scan/capture'
import { labOf } from '@/lib/editor/scan/color'
import { frameOnScreen, screenToPicture } from '@/lib/editor/scan/frame'
import type { Picture } from '@/lib/editor/scan/outlines'
import type { Kept } from '@/store/scanStore'
import type { FaceImage } from '@/workers/findStickers'
import type { ScanFace } from '@/lib/editor/scan/plan'
import { sampleFace, type CellSample } from '@/lib/editor/scan/sample'

/** How often the picture is read, in milliseconds. */
const READ_MS = 100
/** Pixels across the picture of a frame the cells are read on. */
const FRAME_PX = 192
/** How long a face is waited for once the user said it is there. */
const ARMED_MS = 5000

/** A picture's lightness, pixel by pixel (a face read whole). */
function lightOf({ data, width, height }: ImageData): Picture {
  const light = new Float32Array(width * height)
  for (let i = 0; i < light.length; i++)
    light[i] = labOf(data[4 * i]!, data[4 * i + 1]!, data[4 * i + 2]!)[0]
  return { width, height, light }
}

/** Pixels across the image a mirror's face is kept in: its stickers found
 *  on it (stickersWorker.ts), a thin one some 25 pixels wide. */
const SIZED_PX = 480

/** The frame's image, sharp enough to find a mirror's stickers on. */
function imageOf(
  video: HTMLVideoElement,
  crop: { x: number; y: number; width: number; height: number },
  canvas: HTMLCanvasElement,
): FaceImage | undefined {
  const [width, height] = [SIZED_PX, Math.round((SIZED_PX * crop.height) / crop.width)]
  Object.assign(canvas, { width, height })
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return undefined
  ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height)
  return { width, height, rgba: ctx.getImageData(0, 0, width, height).data }
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
  const [holding, setHolding] = useState(false)
  const [cells, setCells] = useState<readonly CellSample[]>([])
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const wide = useRef<HTMLCanvasElement | null>(null)

  const arm = useCallback(() => {
    setNothing(false)
    setArmed(true)
  }, [])
  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => {
      setArmed(false)
      setNothing(true)
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
      const read = sampleFace(ctx.getImageData(0, 0, width, height), face)
      setCells(read)
      const seen = watch(watched, read, performance.now(), face)
      watched = seen.state
      setHolding(watched.frames.length > 1)
      if (seen.taken) {
        // A tap again for the next face.
        setArmed(false)
        const light = face.whole ? lightOf(ctx.getImageData(0, 0, width, height)) : undefined
        const image = face.sized
          ? imageOf(video, crop, (wide.current ??= document.createElement('canvas')))
          : undefined
        take(seen.taken, { photo: canvas.current.toDataURL('image/jpeg', 0.8), light, image })
      }
    }, READ_MS)
    return () => {
      clearInterval(timer)
      setHolding(false)
      setCells([])
    }
  }, [aiming, armed, face, top, bottom, last, take, videoRef])

  return { armed, nothing, arm, holding, cells }
}
