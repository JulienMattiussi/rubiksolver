import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Flashlight, FlashlightOff, Loader2, X } from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { LAYER_THICKNESS, thicknessShare } from '@/lib/core/shape'
import type { CubeColor } from '@/lib/core/types'
import { frameOnScreen, type Size } from '@/lib/editor/scan/frame'
import { coreOf } from '@/lib/editor/scan/box'
import { scanPlan } from '@/lib/editor/scan/plan'
import { useI18n } from '@/i18n/i18nStore'
import { useCamera } from '@/hooks/useCamera'
import { useFaceReading } from '@/hooks/useFaceReading'
import { drawnFace } from '@/three/core/scanDrawing'
import { useCube } from '@/store/cubeStore'
import { scanDebug, useScan } from '@/store/scanStore'
import { Bolded } from '@/components/ui/Bolded'
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
/** How long a 💪 may last, at most (its animation, 1.8 s, and some). */
const CHEER_MS = 2500
/** Room kept under the frame for the buttons, and over it for the
 *  instructions, in pixels: enough for most (a gesture's arrow and three
 *  lines), so that the frame seldom has to shrink. */
const BUTTONS_PX = 130
const CARD_PX = 240

const screenSize = (): Size => ({ width: window.innerWidth, height: window.innerHeight })

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
  const variant = useCube((s) => s.variant)
  const { face: at, status, missed, kept, cheers, last, take, read, close } = useScan()
  const { videoRef, status: camera, mirrored, canTorch, torch, setTorch } = useCamera()
  const [screen, setScreen] = useState(screenSize)
  const [stage, setStage] = useState<'cheer' | InstructionStage>('front')
  // The room over the frame only grows: the frame keeps its size from one
  // instruction to the next, rather than have the puzzle held nearer or
  // farther (and the camera focus again) at each.
  const [cardBottom, setCardBottom] = useState(CARD_PX)
  const fitCard = useCallback((bottom: number) => setCardBottom((b) => Math.max(b, bottom)), [])
  const cheered = useRef(cheers)

  // A camera facing the user: the faces named, checked and read as its
  // mirrored gestures bring them.
  const plan = scanPlan(shape, variant, mirrored)
  useEffect(() => useScan.getState().setBehind(mirrored), [mirrored])
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
  // Leaving the 💪 (whichever comes first, its end or its time) ends it.
  const afterCheer = useCallback(() => {
    if (useScan.getState().status !== 'complete') return setStage('front')
    setStage('hidden')
    read()
  }, [read])
  // A face asked again (`missed`), even the one just taken (the last, after
  // the reading), shows its instruction again.
  useEffect(() => {
    const taken = cheers !== cheered.current
    cheered.current = cheers
    if (taken && !reducedMotion()) setStage('cheer')
    else afterCheer()
  }, [cheers, at, missed, afterCheer])
  // The 💪 says when it is done; should its animation never end (a tab in
  // the background), the scan goes on all the same.
  useEffect(() => {
    if (stage !== 'cheer') return
    const timer = setTimeout(afterCheer, CHEER_MS)
    return () => clearTimeout(timer)
  }, [stage, afterCheer])
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

  // A face named by its color, or a mirror's by its thickness.
  const color = (c: keyof typeof t.colors) =>
    face.sized ? t.tutorialMirror.thickness[c as CubeColor] : t.colors[c].toLowerCase()
  // A camera facing the user (a laptop's): turning the puzzle to the
  // user's right brings the next face, as a mirror shows it.
  const wording =
    mirrored && (face.move === 'turn' || face.move === 'below')
      ? (`${face.move}Mirrored` as const)
      : face.move
  // What a face told by its center (or a mirror's, by its thickness) says.
  const toldText = (front: string, up: string) => {
    const key = missed ? 'show' : wording
    if (!face.sized) return t.scanMoves[key](front, up)
    const sized = t.scanMovesSized
    return (sized[key as keyof typeof sized] ?? sized.show)(front, up)
  }
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
          debug={scanDebug()}
          core={face.open ? coreOf(shape)[at] : undefined}
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
          <ScanInstruction stage={stage === 'cheer' ? 'hidden' : stage} onBottom={fitCard}>
            {/* Told by its center; an even cube, held any way, by the way
                to turn it. A face asked again: no way to it (it is taken
                again where it stands), only what it is. */}
            {face.told ? (
              <p>
                {/* A mirror's faces, named, still come by a gesture. */}
                {face.sized && !missed && <ScanMoveArrow face={face} mirrored={mirrored} />}
                <ColorWords
                  text={toldText(color(face.frontColor), color(face.upColor))}
                  colors={[face.frontColor, face.upColor].map((c) => ({
                    color: c,
                    name: color(c),
                    // A mirror's face, drawn by its thickness.
                    ...(face.sized && {
                      size: thicknessShare(c as CubeColor, LAYER_THICKNESS.mirror),
                    }),
                  }))}
                />
              </p>
            ) : (
              !missed && (
                <p>
                  <ScanMoveArrow face={face} mirrored={mirrored} />
                  <Bolded text={t.scanMovesAny[wording]} strong="font-extrabold text-amber-200" />
                </p>
              )
            )}
            {missed && <ErrorAlert>{t.scanMissed}</ErrorAlert>}
            {/* The face to take again, as it was taken: which one, which
                way up. */}
            {missed && kept[at]?.photo && (
              <img
                src={kept[at]?.photo}
                alt={t.scanAgain}
                className={`mx-auto max-h-28 rounded-md ring-1 ring-white/30 ${mirrored ? '-scale-x-100' : ''}`}
              />
            )}
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

      {aiming && (
        <ScanTake
          armed={armed}
          nothing={nothing}
          onArm={arm}
          hint={face.sized ? t.scanTakeHintSized : undefined}
        />
      )}

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
