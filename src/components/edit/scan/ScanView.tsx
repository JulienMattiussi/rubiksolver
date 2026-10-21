import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Flashlight, FlashlightOff, Loader2, X } from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { watch, watchAfter } from '@/lib/editor/scan/capture'
import { frameOnScreen, screenToPicture, type Size } from '@/lib/editor/scan/frame'
import { scanPlan } from '@/lib/editor/scan/plan'
import { sampleGrid, type CellSample } from '@/lib/editor/scan/sample'
import { useI18n } from '@/i18n/i18nStore'
import { useCamera } from '@/hooks/useCamera'
import { useCube } from '@/store/cubeStore'
import { useScan } from '@/store/scanStore'
import { Button } from '@/components/ui/Button'
import { Cheer } from '@/components/celebration/Cheer'
import { ErrorAlert } from '../ErrorAlert'
import { ColorWords } from './ColorWords'
import { ScanFrame } from './ScanFrame'
import { ScanMoveArrow } from './ScanMoveArrow'
import { ScanInstruction, type InstructionStage } from './ScanInstruction'

/** How often the picture is read, in milliseconds. */
const READ_MS = 100
/** How long an instruction stays big in front, before moving up. */
const FRONT_MS = 1800
/** Room kept under the frame for the buttons, and over it before the
 *  instruction is measured, in pixels. */
const BUTTONS_PX = 88
const CARD_PX = 140
/** Pixels a cell is read on (sample.ts reads its middle). */
const CELL_PX = 24

const screenSize = (): Size => ({ width: window.innerWidth, height: window.innerHeight })

/** `?scandebug` in the address writes each cell's measure in it. */
const debug = () => new URLSearchParams(window.location.search).has('scandebug')

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * The camera scan, full screen: the picture, the frame to aim each face
 * into, what to show, and the face taken by itself once its colors hold
 * in the frame (capture.ts), checked, then the next; read whole at the end
 * and painted in the editor (scanStore). Each face taken is cheered (a 💪,
 * not for who asks for reduced motion), then the next instruction is shown
 * big in front of the picture before it moves up to its place: the camera
 * only reads once it is there.
 */
export function ScanView() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const { face: at, faces, status, missed, cheers, last, take, read, close } = useScan()
  const { videoRef, status: camera, mirrored, canTorch, torch, setTorch } = useCamera()
  const [screen, setScreen] = useState(screenSize)
  const [holding, setHolding] = useState(false)
  const [cells, setCells] = useState<readonly CellSample[]>([])
  const [stage, setStage] = useState<'cheer' | InstructionStage>('front')
  const [cardBottom, setCardBottom] = useState(CARD_PX)
  const cheered = useRef(cheers)
  const canvas = useRef<HTMLCanvasElement | null>(null)

  const plan = scanPlan(shape)
  const face = plan[at]!
  // Below the instruction, above the buttons: the camera reads it there.
  const top = cardBottom + 8
  const rect = frameOnScreen(screen, face.rows, face.cols, top, BUTTONS_PX)
  // Every other face taken: this one may be all white (capture.ts).
  const lastFace = faces.filter(Boolean).length + (faces[at] ? 0 : 1) === plan.length

  useEffect(() => {
    const resize = () => setScreen(screenSize())
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // A face taken: cheered, then the next instruction (or the reading, the
  // last one in); a face asked again (a misread), its instruction.
  const afterCheer = useCallback(() => {
    if (useScan.getState().status === 'complete') read()
    else setStage('front')
  }, [read])
  useEffect(() => {
    const taken = cheers !== cheered.current
    cheered.current = cheers
    if (taken && !reducedMotion()) setStage('cheer')
    else afterCheer()
  }, [cheers, at, afterCheer])
  useEffect(() => {
    if (stage !== 'front') return
    const timer = setTimeout(() => setStage('top'), FRONT_MS)
    return () => clearTimeout(timer)
  }, [stage, at])

  useEffect(() => {
    if (camera !== 'on' || status !== 'aiming' || stage !== 'top') return
    let watched = watchAfter(last)
    const timer = setInterval(() => {
      const video = videoRef.current
      if (!video?.videoWidth) return
      const view = { width: video.clientWidth, height: video.clientHeight }
      const onScreen = frameOnScreen(view, face.rows, face.cols, top, BUTTONS_PX)
      const crop = screenToPicture(onScreen, view, {
        width: video.videoWidth,
        height: video.videoHeight,
      })
      canvas.current ??= document.createElement('canvas')
      const [width, height] = [face.cols * CELL_PX, face.rows * CELL_PX]
      Object.assign(canvas.current, { width, height })
      const ctx = canvas.current.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height)
      const cells = sampleGrid(ctx.getImageData(0, 0, width, height), face.rows, face.cols)
      const seen = watch(watched, cells, performance.now(), face, lastFace)
      watched = seen.state
      setCells(cells)
      setHolding(watched.frames.length > 1)
      if (seen.taken) take(seen.taken)
    }, READ_MS)
    return () => {
      clearInterval(timer)
      setHolding(false)
      setCells([])
    }
  }, [camera, status, stage, face, top, last, lastFace, take, videoRef])

  const color = (c: keyof typeof t.colors) => t.colors[c].toLowerCase()
  const busy = status === 'checking' ? t.scanChecking : status === 'reading' ? t.scanReading : null

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black text-slate-100">
      <video
        ref={videoRef}
        className={`absolute inset-0 size-full object-cover ${mirrored ? '-scale-x-100' : ''}`}
        playsInline
        muted
        autoPlay
      />
      {camera === 'on' && (
        <ScanFrame
          rect={rect}
          rows={face.rows}
          cols={face.cols}
          center={face.center}
          holding={holding}
          cells={cells}
          mirrored={mirrored}
          debug={debug()}
        />
      )}

      <div className="absolute inset-x-0 top-0 flex flex-col gap-2 bg-gradient-to-b from-black/80 to-transparent p-4 pb-10">
        <span className="text-xs font-medium text-slate-300">
          {t.faceStep(at + 1, plan.length)}
        </span>
      </div>

      {camera === 'denied' ? (
        <ScanInstruction stage="top">
          <ErrorAlert>{t.scanDenied}</ErrorAlert>
        </ScanInstruction>
      ) : (
        status !== 'complete' && (
          <ScanInstruction stage={stage === 'cheer' ? 'hidden' : stage} onBottom={setCardBottom}>
            <p>
              {/* Told by its center; an even cube, held any way, by the way
                  to turn it. */}
              {face.center !== null ? (
                <ColorWords
                  text={t.scanMoves[face.move](color(face.frontColor), color(face.upColor))}
                  colors={[
                    { color: face.frontColor, name: color(face.frontColor) },
                    { color: face.upColor, name: color(face.upColor) },
                  ]}
                />
              ) : (
                <>
                  <ScanMoveArrow move={face.move} />
                  {t.scanMovesAny[face.move]}
                </>
              )}
            </p>
            {missed && <ErrorAlert>{t.scanMissed}</ErrorAlert>}
          </ScanInstruction>
        )
      )}

      {stage === 'cheer' && <Cheer key={cheers} onDone={afterCheer} />}

      {busy && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
          <Loader2 className="size-8 animate-spin" aria-hidden />
          <span className="text-sm" role="status">
            {busy}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 p-4 pb-8">
        {canTorch && (
          <Button onClick={() => setTorch(!torch)} aria-pressed={torch}>
            {torch ? (
              <FlashlightOff className="size-4" aria-hidden />
            ) : (
              <Flashlight className="size-4" aria-hidden />
            )}
            {torch ? t.torchOff : t.torchOn}
          </Button>
        )}
        <Button onClick={close}>
          <X className="size-4" aria-hidden />
          {t.cancel}
        </Button>
      </div>
    </div>,
    document.body,
  )
}
