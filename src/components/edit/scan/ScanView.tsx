import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Flashlight, FlashlightOff, Loader2, X } from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { frameOnScreen, type Size } from '@/lib/editor/scan/frame'
import { scanPlan } from '@/lib/editor/scan/plan'
import { useI18n } from '@/i18n/i18nStore'
import { useCamera } from '@/hooks/useCamera'
import { useFaceReading } from '@/hooks/useFaceReading'
import { drawnFace } from '@/three/core/scanDrawing'
import { useCube } from '@/store/cubeStore'
import { useScan } from '@/store/scanStore'
import { Button } from '@/components/ui/Button'
import { Cheer } from '@/components/celebration/Cheer'
import { ErrorAlert } from '../ErrorAlert'
import { ColorWords } from './ColorWords'
import { ScanFrame } from './ScanFrame'
import { ScanMoveArrow } from './ScanMoveArrow'
import { ScanInstruction, type InstructionStage } from './ScanInstruction'
import { ScanTake } from './ScanTake'

/** How long an instruction stays big in front, before moving up. */
const FRONT_MS = 1800
/** Room kept under the frame for the buttons, and over it before the
 *  instruction is measured, in pixels. */
const BUTTONS_PX = 130
const CARD_PX = 140

const screenSize = (): Size => ({ width: window.innerWidth, height: window.innerHeight })

/** `?scandebug` in the address writes each cell's measure in it. */
const debug = () => new URLSearchParams(window.location.search).has('scandebug')

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * The camera scan, full screen: the picture, the frame to aim each face
 * into, what to show, and once the user said the puzzle is there (a tap,
 * ScanTake), the face taken by itself as soon as its colors hold in the
 * frame (capture.ts), checked, then the next; read whole at the end
 * and painted in the editor (scanStore). Each face taken is cheered (a 💪,
 * not for who asks for reduced motion), then the next instruction is shown
 * big in front of the picture before it moves up to its place: the camera
 * only reads once it is there.
 */
export function ScanView() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const { face: at, status, missed, cheers, last, take, read, close } = useScan()
  const { videoRef, status: camera, mirrored, canTorch, torch, setTorch } = useCamera()
  const [screen, setScreen] = useState(screenSize)
  const [stage, setStage] = useState<'cheer' | InstructionStage>('front')
  const [cardBottom, setCardBottom] = useState(CARD_PX)
  const cheered = useRef(cheers)

  const plan = scanPlan(shape)
  // A face whose stickers are no grid, where its drawing shows them.
  const face = drawnFace(shape, plan[at]!)
  // Below the instruction, above the buttons: the camera reads it there.
  const top = cardBottom + 8
  const rect = frameOnScreen(screen, face, top, BUTTONS_PX)

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

  // Each face waits for the user's tap, then is read (useFaceReading).
  const aiming = camera === 'on' && status === 'aiming' && stage === 'top'
  const { armed, nothing, arm, holding, cells } = useFaceReading({
    videoRef,
    face,
    top,
    bottom: BUTTONS_PX,
    aiming,
    last,
    take,
  })

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
          face={face}
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
              {face.told ? (
                <ColorWords
                  text={t.scanMoves[face.move](color(face.frontColor), color(face.upColor))}
                  colors={[
                    { color: face.frontColor, name: color(face.frontColor) },
                    { color: face.upColor, name: color(face.upColor) },
                  ]}
                />
              ) : (
                <>
                  <ScanMoveArrow face={face} />
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

      {aiming && <ScanTake armed={armed} nothing={nothing} onArm={arm} />}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4 pb-8">
        <div className="flex justify-center gap-3">
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
      </div>
    </div>,
    document.body,
  )
}
